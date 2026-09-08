/**
 * Logros: se evalúan al abrir Home, con el estado del perfil entero. No hay
 * contadores que mantener a mano; todo se deriva, así que un logro añadido
 * hoy cae retroactivamente si ya te lo habías ganado.
 */
import { LOGROS, type DefLogro } from '@config/logros';
import { logrosNuevos, type EstadoParaLogros } from '@/lib/domain/logros';
import { progresoDesdeXp } from '@/lib/domain/niveles';
import { crearAleatorio } from '@/lib/domain/rng';
import { PERFIL, prisma } from './prisma';
import { xpPorCategoria } from './consultas';
import { aJson } from './json';

async function estadoDelPerfil(): Promise<EstadoParaLogros> {
  const [logs, rachaGlobal, nodos, misiones, xpKeys] = await Promise.all([
    prisma.activityLog.findMany({
      where: { profileId: PERFIL },
      select: { diaLogico: true, fecha: true, categoryId: true, category: { select: { key: true } } },
    }),
    prisma.streak.findUnique({
      where: { profileId_clave: { profileId: PERFIL, clave: 'global' } },
    }),
    prisma.userNode.findMany({ where: { profileId: PERFIL } }),
    prisma.quest.findMany({
      where: { profileId: PERFIL, estado: 'completada' },
      select: { tipo: true },
    }),
    xpPorCategoria(),
  ]);

  const categoriasPorDia = new Map<string, Set<string>>();
  for (const l of logs) {
    const set = categoriasPorDia.get(l.diaLogico) ?? new Set<string>();
    set.add(l.categoryId);
    categoriasPorDia.set(l.diaLogico, set);
  }
  const maxCategoriasEnUnDia = Math.max(
    0,
    ...[...categoriasPorDia.values()].map((s) => s.size),
  );

  const nivelPorCategoria: Record<string, number> = {};
  for (const [key, xp] of Object.entries(xpKeys)) {
    nivelPorCategoria[key] = progresoDesdeXp(xp).nivel;
  }
  const xpTotal = Object.values(xpKeys).reduce((a, b) => a + b, 0);

  return {
    registros: logs.length,
    rachaMaxima: rachaGlobal?.diasMaximos ?? 0,
    nivelGlobal: progresoDesdeXp(xpTotal).nivel,
    nivelPorCategoria,
    maxCategoriasEnUnDia,
    nodosDesbloqueados: nodos.filter((n) => n.puntosGastados > 0).length,
    maestrias: nodos.filter((n) => n.maestriaVerificadaEn).length,
    misionesCompletadas: misiones.length,
    semanalesCompletadas: misiones.filter((m) => m.tipo === 'semanal').length,
    registrosDeOcio: logs.filter((l) => l.category.key === 'ocio').length,
    registrosAntesDeLas7: logs.filter((l) => l.fecha.getHours() < 7).length,
    registrosDespuesDeLas23: logs.filter((l) => l.fecha.getHours() >= 23).length,
  };
}

/** Desbloquea los que toquen y devuelve los nuevos, para celebrarlos. */
export async function sincronizarLogros(): Promise<DefLogro[]> {
  const [estado, yaTiene] = await Promise.all([
    estadoDelPerfil(),
    prisma.userAchievement.findMany({
      where: { profileId: PERFIL },
      include: { achievement: { select: { key: true } } },
    }),
  ]);

  const keysQueTiene = new Set(yaTiene.map((u) => u.achievement.key));
  const nuevos = logrosNuevos(LOGROS, estado, keysQueTiene);
  if (nuevos.length === 0) return [];

  const filas = await prisma.achievement.findMany({ where: { key: { in: nuevos } } });
  for (const fila of filas) {
    await prisma.userAchievement.create({
      data: { achievementId: fila.id, profileId: PERFIL },
    });
  }

  return LOGROS.filter((l) => nuevos.includes(l.key));
}

/**
 * Regala un logro secreto que aún no se tuviera. Es el premio del efecto
 * sorpresa "logro-secreto": la única forma de conseguir uno sin cumplir su
 * condición, y por eso solo puede salir de una misión sorpresa.
 */
export async function desbloquearSecretoAlAzar(semilla: string): Promise<DefLogro | null> {
  const yaTiene = await prisma.userAchievement.findMany({
    where: { profileId: PERFIL },
    include: { achievement: { select: { key: true } } },
  });
  const keys = new Set(yaTiene.map((u) => u.achievement.key));
  const candidatos = LOGROS.filter((l) => l.esSecreto && !keys.has(l.key));
  if (candidatos.length === 0) return null;

  const elegido = crearAleatorio(`secreto:${semilla}`).elegir(candidatos);
  const fila = await prisma.achievement.findUnique({ where: { key: elegido.key } });
  if (!fila) return null;

  await prisma.userAchievement.create({
    data: { achievementId: fila.id, profileId: PERFIL, contextoJson: aJson({ via: 'sorpresa' }) },
  });
  return elegido;
}

export type LogroVista = {
  key: string;
  nombre: string;
  descripcion: string;
  esSecreto: boolean;
  desbloqueado: boolean;
  desbloqueadoEn: Date | null;
};

/**
 * La colección. Un secreto sin desbloquear no enseña ni nombre ni
 * descripción: contarlo de antemano lo convierte en una tarea más.
 */
export async function coleccionDeLogros(): Promise<LogroVista[]> {
  const desbloqueados = await prisma.userAchievement.findMany({
    where: { profileId: PERFIL },
    include: { achievement: { select: { key: true } } },
  });
  const fechaPorKey = new Map(
    desbloqueados.map((u) => [u.achievement.key, u.desbloqueadoEn]),
  );

  return [...LOGROS]
    .sort((a, b) => a.orden - b.orden)
    .map((l) => {
      const fecha = fechaPorKey.get(l.key) ?? null;
      const desbloqueado = fecha !== null;
      return {
        key: l.key,
        nombre: desbloqueado || !l.esSecreto ? l.nombre : 'Secreto',
        descripcion: desbloqueado || !l.esSecreto ? l.descripcion : 'Sigue jugando.',
        esSecreto: l.esSecreto,
        desbloqueado,
        desbloqueadoEn: fecha,
      };
    });
}
