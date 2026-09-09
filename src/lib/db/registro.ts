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
import { aJson, deJson } from './json';
import { PERFIL, prisma } from './prisma';

/** Cuánto atrás puede venir un registro de la cola. Más allá, algo va mal. */
export const DIAS_MAXIMOS_DE_RETRASO = 14;

export const entradaSchema = z.object({
  actividadId: z.string().min(1),
  cantidad: z.number().positive().max(1440),
  intensidad: z.enum(['suave', 'normal', 'exigente']),
  nota: z.string().max(280).optional(),
  /**
   * Cuándo ocurrió de verdad, en ISO. Lo manda la cola del móvil: un registro
   * hecho sin cobertura a las siete de la tarde tiene que contar a las siete
   * de la tarde, no cuando el teléfono vuelva a tener red.
   */
  fecha: z.string().min(20).max(40).optional(),
  /**
   * Clave que genera el móvil. Es lo que hace que reenviar la cola sea
   * inofensivo: si ya existe un registro con esa clave, no se crea otro.
   */
  claveCliente: z.string().min(8).max(64).optional(),
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
      /** true si la cola reenvió algo que el servidor ya tenía. */
      yaEstaba?: boolean;
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
  ahoraPorDefecto: Date = new Date(),
): Promise<ResultadoRegistro> {
  const parseado = entradaSchema.safeParse(datos);
  if (!parseado.success) {
    return { ok: false, error: parseado.error.issues[0]?.message ?? 'Datos invalidos' };
  }
  const entrada = parseado.data;

  // Si viene de la cola offline, manda su hora real; si no, ahora.
  let ahora = ahoraPorDefecto;
  if (entrada.fecha) {
    const declarada = new Date(entrada.fecha);
    if (Number.isNaN(declarada.getTime())) {
      return { ok: false, error: 'La fecha del registro no es válida' };
    }
    const atrasoDias = (ahoraPorDefecto.getTime() - declarada.getTime()) / 86_400_000;
    if (atrasoDias > DIAS_MAXIMOS_DE_RETRASO) {
      return { ok: false, error: 'Ese registro es demasiado viejo para entrar ahora' };
    }
    // Un poco de holgura por el reloj del móvil, pero nada de futuro real.
    if (atrasoDias < -1 / 24) {
      return { ok: false, error: 'Ese registro viene con fecha futura' };
    }
    ahora = declarada;
  }

  // Idempotencia: reenviar la cola no puede duplicar nada.
  if (entrada.claveCliente) {
    const yaEstaba = await prisma.activityLog.findUnique({
      where: {
        profileId_claveCliente: { profileId: PERFIL, claveCliente: entrada.claveCliente },
      },
      include: { activity: { include: { category: true } } },
    });
    if (yaEstaba) {
      const xpDespues = await xpPorCategoria();
      const totalDespues = Object.values(xpDespues).reduce((a, b) => a + b, 0);
      const progreso = progresoDesdeXp(totalDespues);
      const catKey = yaEstaba.activity.category.key;
      return {
        ok: true,
        yaEstaba: true,
        xpDelRegistro: yaEstaba.xpCalculado,
        xpExtraRetroactivo: 0,
        modificadores: deJson<Record<string, number>>(yaEstaba.modificadoresJson, {}),
        dificultad: yaEstaba.dificultadRelativa,
        minutosNoComputados: Math.round(yaEstaba.duracionBrutaMin - yaEstaba.duracionMin),
        actividad: yaEstaba.activity.nombre,
        categoria: {
          key: catKey,
          nombre: yaEstaba.activity.category.nombre,
          nivelAntes: progreso.nivel,
          nivelDespues: progreso.nivel,
        },
        global: { nivelAntes: progreso.nivel, nivelDespues: progreso.nivel, progreso },
        subioNivel: false,
      };
    }
  }

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
          claveCliente: log.id === nuevoId ? (entrada.claveCliente ?? null) : null,
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
