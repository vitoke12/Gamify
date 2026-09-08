/**
 * Misiones: generación perezosa, evaluación automática y cofres.
 *
 * No hay cron. El tablero se genera la primera vez que se abre la app después
 * del corte de las 05:00, con una semilla que es la fecha, así que sale
 * exactamente igual que habría salido a esa hora. Un ordenador apagado por la
 * noche no se pierde el día.
 */
import { MISIONES, type ObjetivoDef } from '@config/misiones';
import { lunesDe, semanaIso, sumarDias } from '@/lib/domain/dia';
import {
  generarMisionSemanal,
  generarTableroDelDia,
  progresoObjetivo,
  textoProgreso,
  type EfectoSorpresa,
  type MisionGenerada,
  type ProgresoObjetivo,
  type RegistroParaObjetivo,
} from '@/lib/domain/misiones';
import { abrirCofre } from '@/lib/domain/cofres';
import type { TipoMision } from '@/lib/domain/tipos';
import { PERFIL, prisma } from './prisma';
import { diaDeHoy, xpPorCategoria } from './consultas';
import { desbloquearSecretoAlAzar } from './logros';
import { aJson, deJson } from './json';

/** Bonus fijo que paga el efecto sorpresa "bonus-fijo". */
const BONUS_FIJO = 150;

export type MisionVista = {
  id: string;
  tipo: TipoMision;
  descripcion: string;
  categoria: string;
  esfera: string;
  xp: number;
  estado: string;
  progreso: ProgresoObjetivo;
  texto: string;
  completada: boolean;
  esSorpresa: boolean;
};

export type ResultadoMisiones = {
  tablero: MisionVista[];
  semanal: MisionVista | null;
  /** Las que se han completado en esta pasada: hay que celebrarlas. */
  reciencompletadas: MisionVista[];
  /** Logros secretos regalados por el efecto sorpresa. */
  secretos: string[];
};

type Payload = { objetivo: ObjetivoDef; efecto?: EfectoSorpresa };

async function registrosDe(dias: string[]): Promise<RegistroParaObjetivo[]> {
  const logs = await prisma.activityLog.findMany({
    where: { profileId: PERFIL, diaLogico: { in: dias } },
    include: { activity: true, category: true },
  });
  // Minutos BRUTOS: el tope diario recorta la XP, no lo que de verdad hiciste.
  return logs.map((l) => ({
    categoria: l.category.key,
    actividad: l.activity.key,
    minutos: l.duracionBrutaMin,
  }));
}

/** Categoría que manda en la misión principal: racha activa, o la más trabajada. */
async function categoriaQueManda(): Promise<string | null> {
  const rachas = await prisma.streak.findMany({
    where: { profileId: PERFIL, categoryId: { not: null }, diasActuales: { gt: 0 } },
    include: { category: true },
    orderBy: { diasActuales: 'desc' },
  });
  if (rachas[0]?.category) return rachas[0].category.key;

  const xp = await xpPorCategoria();
  const ordenadas = Object.entries(xp)
    .filter(([, valor]) => valor > 0)
    .sort((a, b) => b[1] - a[1]);
  return ordenadas[0]?.[0] ?? null;
}

export async function sincronizarMisiones(): Promise<ResultadoMisiones> {
  const hoy = await diaDeHoy();
  const semana = semanaIso(hoy);

  const categorias = await prisma.category.findMany({ where: { activa: true } });
  const idPorKey = new Map(categorias.map((c) => [c.key, c.id]));
  const disponibles = categorias.map((c) => c.key);

  // ── Generar el tablero del día si todavía no existe ─────────────────────
  const yaHay = await prisma.quest.count({
    where: { profileId: PERFIL, diaLogico: hoy, tipo: { not: 'semanal' } },
  });
  if (yaHay === 0) {
    const usos = await prisma.quest.groupBy({
      by: ['plantillaKey'],
      where: { profileId: PERFIL, semanaIso: semana },
      _count: { plantillaKey: true },
    });
    const usosEstaSemana = Object.fromEntries(
      usos.map((u) => [u.plantillaKey, u._count.plantillaKey]),
    );

    const tablero = generarTableroDelDia({
      dia: hoy,
      pool: MISIONES,
      categoriaPrincipal: await categoriaQueManda(),
      categoriasDisponibles: disponibles,
      usosEstaSemana,
    });
    await guardar(tablero, hoy, semana, idPorKey);
  }

  // ── Y la semanal, una por semana ────────────────────────────────────────
  const haySemanal = await prisma.quest.count({
    where: { profileId: PERFIL, semanaIso: semana, tipo: 'semanal' },
  });
  if (haySemanal === 0) {
    const semanal = generarMisionSemanal({
      semana,
      pool: MISIONES,
      categoriasDisponibles: disponibles,
    });
    if (semanal) await guardar([semanal], lunesDe(hoy), semana, idPorKey);
  }

  // ── Evaluar ─────────────────────────────────────────────────────────────
  const [delDia, laSemanal] = await Promise.all([
    prisma.quest.findMany({
      where: { profileId: PERFIL, diaLogico: hoy, tipo: { not: 'semanal' } },
      include: { category: true },
      orderBy: { creadoEn: 'asc' },
    }),
    prisma.quest.findFirst({
      where: { profileId: PERFIL, semanaIso: semana, tipo: 'semanal' },
      include: { category: true },
    }),
  ]);

  const lunes = lunesDe(hoy);
  const diasDeLaSemana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const [registrosHoy, registrosSemana] = await Promise.all([
    registrosDe([hoy]),
    registrosDe(diasDeLaSemana),
  ]);

  const reciencompletadas: MisionVista[] = [];
  const secretos: string[] = [];

  const evaluar = async (
    quest: (typeof delDia)[number],
    registros: RegistroParaObjetivo[],
  ): Promise<MisionVista> => {
    const payload = deJson<Payload>(quest.objetivoJson, {
      objetivo: { tipo: 'minutosTotales', minutos: 0 },
    });
    const progreso = progresoObjetivo(payload.objetivo, registros);
    let estado = quest.estado;

    // Solo se completan las aceptadas: una secundaria que no elegiste no
    // cuenta aunque la hayas cumplido de rebote.
    if (estado === 'aceptada' && progreso.hecho) {
      estado = 'completada';
      const xp = xpFinal(quest.xpRecompensa, payload.efecto);
      await prisma.$transaction(async (tx) => {
        await tx.quest.update({
          where: { id: quest.id },
          data: { estado, completadaEn: new Date() },
        });
        await tx.xpEntry.create({
          data: {
            categoryId: quest.categoryId ?? categorias[0].id,
            origen: 'mision',
            origenId: quest.id,
            diaLogico: hoy,
            xp,
          },
        });
      });

      // El tercer efecto sorpresa regala un secreto: es la unica via de
      // conseguir uno sin cumplir su condicion.
      if (payload.efecto === 'logro-secreto') {
        const regalado = await desbloquearSecretoAlAzar(quest.id);
        if (regalado) secretos.push(regalado.nombre);
      }

      if (quest.tipo === 'semanal') {
        const recompensa = abrirCofre(quest.id);
        await prisma.reward.create({
          data: {
            questId: quest.id,
            tipo: recompensa.tipo,
            valorJson: aJson(recompensa),
            expiraEn:
              recompensa.tipo === 'multiplicador'
                ? new Date(Date.now() + recompensa.dias * 86_400_000)
                : null,
          },
        });
        if (recompensa.tipo === 'xp') {
          await prisma.xpEntry.create({
            data: {
              categoryId: quest.categoryId ?? categorias[0].id,
              origen: 'cofre',
              origenId: quest.id,
              diaLogico: hoy,
              xp: recompensa.xp,
            },
          });
        }
      }
    }

    const vista: MisionVista = {
      id: quest.id,
      tipo: quest.tipo as TipoMision,
      descripcion: quest.descripcion,
      categoria: quest.category?.nombre ?? '',
      esfera: quest.category?.esfera ?? 'base',
      xp: xpFinal(quest.xpRecompensa, payload.efecto),
      estado,
      progreso,
      texto: textoProgreso(payload.objetivo, progreso),
      completada: estado === 'completada',
      esSorpresa: quest.tipo === 'sorpresa',
    };
    if (estado === 'completada' && quest.estado !== 'completada') reciencompletadas.push(vista);
    return vista;
  };

  const tablero: MisionVista[] = [];
  for (const quest of delDia) tablero.push(await evaluar(quest, registrosHoy));
  const semanalVista = laSemanal ? await evaluar(laSemanal, registrosSemana) : null;

  return { tablero, semanal: semanalVista, reciencompletadas, secretos };
}

function xpFinal(base: number, efecto?: EfectoSorpresa): number {
  if (efecto === 'doble-xp') return base * 2;
  if (efecto === 'bonus-fijo') return base + BONUS_FIJO;
  return base;
}

async function guardar(
  misiones: MisionGenerada[],
  dia: string,
  semana: string,
  idPorKey: Map<string, string>,
) {
  for (const m of misiones) {
    await prisma.quest.create({
      data: {
        plantillaKey: m.plantillaKey,
        tipo: m.tipo,
        diaLogico: dia,
        semanaIso: semana,
        categoryId: idPorKey.get(m.categoria) ?? null,
        descripcion: m.descripcion,
        objetivoJson: aJson({ objetivo: m.objetivo, efecto: m.efecto }),
        xpRecompensa: m.xp,
        estado: m.estado,
      },
    });
  }
}

/** El usuario elige dos de las tres secundarias. */
export async function alternarSecundaria(questId: string): Promise<{ ok: boolean; error?: string }> {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.tipo !== 'secundaria') return { ok: false, error: 'Esa misión no existe' };
  if (quest.estado === 'completada') return { ok: false, error: 'Ya está completada' };

  if (quest.estado === 'aceptada') {
    await prisma.quest.update({ where: { id: questId }, data: { estado: 'ofrecida' } });
    return { ok: true };
  }

  const aceptadas = await prisma.quest.count({
    where: {
      profileId: PERFIL,
      diaLogico: quest.diaLogico,
      tipo: 'secundaria',
      estado: { in: ['aceptada', 'completada'] },
    },
  });
  if (aceptadas >= 2) {
    return { ok: false, error: 'Solo puedes elegir dos secundarias; suelta una antes' };
  }

  await prisma.quest.update({ where: { id: questId }, data: { estado: 'aceptada' } });
  return { ok: true };
}
