/**
 * Escritura de un registro de actividad.
 *
 * Vive separado del server action a proposito: aqui no hay nada de Next, asi
 * que se puede ejecutar contra una base de pruebas sin levantar el framework.
 * El action se limita a envolverlo y revalidar.
 */
import { z } from 'zod';
import { ECONOMIA } from '@config/economia';
import { diaLogico } from '@/lib/domain/dia';
import { progresoDesdeXp, type Progreso } from '@/lib/domain/niveles';
import { recalcularDia } from '@/lib/domain/xp';
import type { EntradaRegistro } from '@/lib/domain/tipos';
import { contextoDelDia, horaCorte, xpPorCategoria } from './consultas';
import { aJson } from './json';
import { PERFIL, prisma } from './prisma';

export const entradaSchema = z.object({
  actividadId: z.string().min(1),
  cantidad: z.number().positive().max(1440),
  intensidad: z.enum(['suave', 'normal', 'exigente']),
  nota: z.string().max(280).optional(),
});

export type DatosRegistro = z.infer<typeof entradaSchema>;

export type ResultadoRegistro =
  | {
      ok: true;
      xpDelRegistro: number;
      /** XP que han ganado otros logs del dia al recalcularse (sinergia). */
      xpExtraRetroactivo: number;
      modificadores: Record<string, number>;
      dificultad: number;
      minutosNoComputados: number;
      categoria: { key: string; nombre: string; nivelAntes: number; nivelDespues: number };
      actividad: string;
      global: { nivelAntes: number; nivelDespues: number; progreso: Progreso };
      subioNivel: boolean;
    }
  | { ok: false; error: string };

/**
 * Registra una actividad y recalcula el dia entero.
 *
 * Recalcular todo el dia (y no solo el log nuevo) es lo que permite que la
 * sinergia sea retroactiva y que el tope diario no dependa del orden de
 * escritura. El coste es despreciable: son unos pocos logs por dia.
 */
export async function aplicarRegistro(
  datos: DatosRegistro,
  ahora: Date = new Date(),
): Promise<ResultadoRegistro> {
  const parseado = entradaSchema.safeParse(datos);
  if (!parseado.success) {
    return { ok: false, error: parseado.error.issues[0]?.message ?? 'Datos invalidos' };
  }
  const entrada = parseado.data;

  const actividad = await prisma.activity.findUnique({
    where: { id: entrada.actividadId },
    include: { category: true },
  });
  if (!actividad) return { ok: false, error: 'Esa actividad no existe' };

  const corte = await horaCorte();
  const dia = diaLogico(ahora, corte);

  const xpAntes = await xpPorCategoria();
  const totalAntes = Object.values(xpAntes).reduce((a, b) => a + b, 0);

  const [contexto, logsDelDia] = await Promise.all([
    contextoDelDia(dia),
    prisma.activityLog.findMany({ where: { profileId: PERFIL, diaLogico: dia } }),
  ]);

  const nuevoId = crypto.randomUUID();
  const entradas: EntradaRegistro[] = [
    ...logsDelDia.map((l) => ({
      id: l.id,
      actividadId: l.activityId,
      fecha: l.fecha,
      cantidad: l.cantidad,
      intensidad: l.intensidad,
      tieneEvidencia: Boolean(l.evidenciaUrl),
    })),
    {
      id: nuevoId,
      actividadId: entrada.actividadId,
      fecha: ahora,
      cantidad: entrada.cantidad,
      intensidad: ECONOMIA.intensidades[entrada.intensidad],
      tieneEvidencia: false,
    },
  ];

  const calculados = recalcularDia(entradas, contexto);

  await prisma.$transaction(async (tx) => {
    for (const log of calculados) {
      const comun = {
        categoryId: log.categoriaId,
        fecha: log.fecha,
        diaLogico: log.diaLogico,
        cantidad: log.cantidad,
        duracionBrutaMin: log.duracionBrutaMin,
        duracionMin: log.duracionMin,
        intensidad: log.intensidad,
        dificultadRelativa: log.dificultadRelativa,
        modificadoresJson: aJson(log.modificadores),
        xpBase: log.xpBase,
        xpCalculado: log.xpCalculado,
        versionFormula: log.versionFormula,
      };
      await tx.activityLog.upsert({
        where: { id: log.id },
        update: comun,
        create: {
          id: log.id,
          activityId: log.actividadId,
          nota: log.id === nuevoId ? (entrada.nota ?? null) : null,
          ...comun,
        },
      });
    }

    // El libro mayor es derivado: se reconstruye para los logs tocados en
    // lugar de parchearse a mano.
    const ids = calculados.map((l) => l.id);
    await tx.xpEntry.deleteMany({ where: { logId: { in: ids } } });
    for (const log of calculados) {
      if (log.xpCalculado === 0) continue;
      await tx.xpEntry.create({
        data: {
          categoryId: log.categoriaId,
          origen: 'actividad',
          origenId: log.id,
          logId: log.id,
          diaLogico: log.diaLogico,
          xp: log.xpCalculado,
        },
      });
    }
  });

  const xpDespues = await xpPorCategoria();
  const totalDespues = Object.values(xpDespues).reduce((a, b) => a + b, 0);
  const nuevo = calculados.find((l) => l.id === nuevoId)!;

  const globalAntes = progresoDesdeXp(totalAntes);
  const globalDespues = progresoDesdeXp(totalDespues);
  const catKey = actividad.category.key;

  return {
    ok: true,
    xpDelRegistro: nuevo.xpCalculado,
    xpExtraRetroactivo: totalDespues - totalAntes - nuevo.xpCalculado,
    modificadores: nuevo.modificadores,
    dificultad: nuevo.dificultadRelativa,
    minutosNoComputados: Math.round(nuevo.duracionBrutaMin - nuevo.duracionMin),
    actividad: actividad.nombre,
    categoria: {
      key: catKey,
      nombre: actividad.category.nombre,
      nivelAntes: progresoDesdeXp(xpAntes[catKey] ?? 0).nivel,
      nivelDespues: progresoDesdeXp(xpDespues[catKey] ?? 0).nivel,
    },
    global: {
      nivelAntes: globalAntes.nivel,
      nivelDespues: globalDespues.nivel,
      progreso: globalDespues,
    },
    subioNivel: globalDespues.nivel > globalAntes.nivel,
  };
}
