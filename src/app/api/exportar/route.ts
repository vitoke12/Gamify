import { PERFIL, prisma } from '@/lib/db/prisma';
import { diaDeHoy } from '@/lib/db/consultas';

export const dynamic = 'force-dynamic';

/**
 * Exportación completa en JSON. Tus datos son tuyos y tienen que poder salir
 * de aquí en un archivo que se entienda sin la app: nombres y keys incluidos,
 * no solo ids opacos.
 */
export async function GET() {
  const hoy = await diaDeHoy();

  const [perfil, categorias, actividades, nodos, logs, xp, misiones, premios, nodosUsuario, logros, rachas, clases, chequeos, respecs] =
    await Promise.all([
      prisma.profile.findUnique({ where: { id: PERFIL } }),
      prisma.category.findMany({ orderBy: { orden: 'asc' } }),
      prisma.activity.findMany({ include: { category: { select: { key: true } }, node: { select: { key: true } } } }),
      prisma.skillNode.findMany({ include: { branch: { select: { key: true, category: { select: { key: true } } } } } }),
      prisma.activityLog.findMany({
        where: { profileId: PERFIL },
        orderBy: { fecha: 'asc' },
        include: { activity: { select: { key: true } }, category: { select: { key: true } } },
      }),
      prisma.xpEntry.findMany({ where: { profileId: PERFIL }, orderBy: { creadoEn: 'asc' }, include: { category: { select: { key: true } } } }),
      prisma.quest.findMany({ where: { profileId: PERFIL }, orderBy: { creadoEn: 'asc' } }),
      prisma.reward.findMany({ where: { profileId: PERFIL }, orderBy: { otorgadoEn: 'asc' } }),
      prisma.userNode.findMany({ where: { profileId: PERFIL }, include: { node: { select: { key: true } } } }),
      prisma.userAchievement.findMany({ where: { profileId: PERFIL }, include: { achievement: { select: { key: true, nombre: true } } } }),
      prisma.streak.findMany({ where: { profileId: PERFIL }, include: { congelados: true } }),
      prisma.classSnapshot.findMany({ where: { profileId: PERFIL }, orderBy: { mes: 'asc' } }),
      prisma.senseCheck.findMany({ where: { profileId: PERFIL }, include: { category: { select: { key: true } } } }),
      prisma.respecEvent.findMany({ where: { profileId: PERFIL }, include: { category: { select: { key: true } } } }),
    ]);

  const datos = {
    exportadoEn: new Date().toISOString(),
    diaLogico: hoy,
    formato: 1,
    perfil,
    catalogo: {
      categorias,
      actividades: actividades.map((a) => ({ ...a, categoria: a.category.key, nodo: a.node?.key ?? null, category: undefined, node: undefined })),
      nodos: nodos.map((n) => ({ ...n, rama: n.branch.key, categoria: n.branch.category.key, branch: undefined })),
    },
    registros: logs.map((l) => ({ ...l, actividad: l.activity.key, categoria: l.category.key, activity: undefined, category: undefined })),
    xp: xp.map((e) => ({ ...e, categoria: e.category.key, category: undefined })),
    misiones,
    premios,
    nodosDesbloqueados: nodosUsuario.map((n) => ({ ...n, nodo: n.node.key, node: undefined })),
    logros: logros.map((l) => ({ ...l, logro: l.achievement.key, nombre: l.achievement.nombre, achievement: undefined })),
    rachas,
    clases,
    chequeosDeSentido: chequeos.map((c) => ({ ...c, categoria: c.category.key, category: undefined })),
    respecs: respecs.map((r) => ({ ...r, categoria: r.category.key, category: undefined })),
  };

  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="gamify-${hoy}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
