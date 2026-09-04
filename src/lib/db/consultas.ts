/**
 * Lectura. Esta capa traduce filas de Prisma a los tipos planos del dominio,
 * y es la unica que sabe que existe una base de datos: /lib/domain nunca
 * importa Prisma, por eso sus tests corren sin levantar nada.
 */
import { diaLogico, sumarDias } from '@/lib/domain/dia';
import { categoriaMasDescuidada, estadoDeCategorias } from '@/lib/domain/perfil';
import { progresoDesdeXp } from '@/lib/domain/niveles';
import { calcularRacha } from '@/lib/domain/rachas';
import type { Actividad, ContextoCalculo, Unidad } from '@/lib/domain/tipos';
import { PERFIL, prisma } from './prisma';

export async function horaCorte(): Promise<number> {
  const perfil = await prisma.profile.findUnique({ where: { id: PERFIL } });
  return perfil?.horaCorteDia ?? 5;
}

export async function diaDeHoy(): Promise<string> {
  return diaLogico(new Date(), await horaCorte());
}

/**
 * XP acumulada por key de categoria. Se deriva del libro mayor, siempre.
 * Con `antesDelDia` devuelve la foto anterior a ese dia logico, que es lo que
 * necesita el motor para congelar los modificadores que dependen del perfil.
 */
export async function xpPorCategoria(antesDelDia?: string): Promise<Record<string, number>> {
  const filas = await prisma.xpEntry.groupBy({
    by: ['categoryId'],
    where: {
      profileId: PERFIL,
      ...(antesDelDia ? { diaLogico: { lt: antesDelDia } } : {}),
    },
    _sum: { xp: true },
  });
  const categorias = await prisma.category.findMany({ select: { id: true, key: true } });
  const keyPorId = new Map(categorias.map((c) => [c.id, c.key]));

  const salida: Record<string, number> = {};
  for (const c of categorias) salida[c.key] = 0;
  for (const fila of filas) {
    const key = keyPorId.get(fila.categoryId);
    if (key) salida[key] = fila._sum.xp ?? 0;
  }
  return salida;
}

export type CategoriaRegistrable = {
  id: string;
  key: string;
  nombre: string;
  esfera: string;
  icono: string;
  actividades: {
    id: string;
    nombre: string;
    unidad: Unidad;
    minutosPorUnidad: number;
  }[];
};

/** Lo que necesita la pantalla de registro rapido: categoria -> actividades. */
export async function categoriasRegistrables(): Promise<CategoriaRegistrable[]> {
  const categorias = await prisma.category.findMany({
    where: { activa: true },
    orderBy: { orden: 'asc' },
    include: {
      activities: { where: { activa: true }, orderBy: { orden: 'asc' } },
    },
  });

  return categorias.map((c) => ({
    id: c.id,
    key: c.key,
    nombre: c.nombre,
    esfera: c.esfera,
    icono: c.icono,
    actividades: c.activities.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      unidad: a.unidad as Unidad,
      minutosPorUnidad: a.minutosPorUnidad,
    })),
  }));
}

/** Monta el contexto que necesita el motor para calcular un dia concreto. */
export async function contextoDelDia(dia: string): Promise<ContextoCalculo> {
  const [categorias, actividadesDb, nodosUsuario, perfil] = await Promise.all([
    prisma.category.findMany(),
    prisma.activity.findMany(),
    prisma.userNode.findMany({ where: { profileId: PERFIL } }),
    prisma.profile.findUnique({ where: { id: PERFIL } }),
  ]);

  const keyPorId = new Map(categorias.map((c) => [c.id, c.key]));

  const actividades: Record<string, Actividad> = {};
  for (const a of actividadesDb) {
    actividades[a.id] = {
      id: a.id,
      key: a.key,
      categoriaId: a.categoryId,
      nodoId: a.nodeId,
      nombre: a.nombre,
      unidad: a.unidad as Unidad,
      minutosPorUnidad: a.minutosPorUnidad,
      xpBasePorMinuto: a.xpBasePorMinuto,
      tierEquivalente: a.tierEquivalente,
    };
  }

  const topeDiarioPorCategoria: Record<string, number> = {};
  for (const c of categorias) topeDiarioPorCategoria[c.id] = c.topeDiarioMin;

  const nivelPorNodo: Record<string, number> = {};
  for (const n of nodosUsuario) nivelPorNodo[n.nodeId] = n.nivelActual;

  // Actividades con algun log en dias ANTERIORES: son las que ya no dan
  // bonus de novedad.
  const vistas = await prisma.activityLog.findMany({
    where: { profileId: PERFIL, diaLogico: { lt: dia } },
    select: { activityId: true },
    distinct: ['activityId'],
  });

  // Racha con la que se entra al dia: cuenta hasta el dia anterior.
  const diasPrevios = await prisma.activityLog.findMany({
    where: { profileId: PERFIL, diaLogico: { lt: dia } },
    select: { diaLogico: true, categoryId: true },
    distinct: ['diaLogico', 'categoryId'],
  });
  const ayer = sumarDias(dia, -1);
  const diasRachaPorCategoria: Record<string, number> = {};
  for (const c of categorias) {
    const dias = diasPrevios.filter((d) => d.categoryId === c.id).map((d) => d.diaLogico);
    diasRachaPorCategoria[c.id] = calcularRacha(dias, ayer).diasActuales;
  }

  // La categoria descuidada se congela al estado con el que se ENTRA al dia.
  // Si se recalculase con la XP de hoy, la etiqueta saltaria de una categoria
  // a otra a mitad del dia y la XP ya concedida podria bajar. Congelada, lo
  // ya otorgado solo puede subir (por sinergia), nunca menguar.
  const xpKeys = await xpPorCategoria(dia);
  const activas = categorias.filter((c) => c.activa);
  const descuidadaKey = categoriaMasDescuidada(
    xpKeys,
    activas.map((c) => c.key),
  );
  const idPorKey = new Map(categorias.map((c) => [c.key, c.id]));

  return {
    actividades,
    topeDiarioPorCategoria,
    nivelPorNodo,
    actividadesYaVistas: new Set(vistas.map((v) => v.activityId)),
    diasRachaPorCategoria,
    categoriaDescuidada: descuidadaKey ? (idPorKey.get(descuidadaKey) ?? null) : null,
    horaCorteDia: perfil?.horaCorteDia ?? 5,
    // clase: pendiente de la fase 4. Sin ella no hay pasiva y esta bien:
    // no se puede tener clase antes de haber jugado.
  };
}

export type ResumenHome = Awaited<ReturnType<typeof resumenHome>>;

export async function resumenHome() {
  const hoy = await diaDeHoy();
  const [categorias, xpKeys, diasConActividad, perfil] = await Promise.all([
    prisma.category.findMany({ orderBy: { orden: 'asc' } }),
    xpPorCategoria(),
    prisma.activityLog.findMany({
      where: { profileId: PERFIL },
      select: { diaLogico: true },
      distinct: ['diaLogico'],
    }),
    prisma.profile.findUnique({ where: { id: PERFIL } }),
  ]);

  const xpTotal = Object.values(xpKeys).reduce((a, b) => a + b, 0);
  const estados = estadoDeCategorias(
    xpKeys,
    categorias.map((c) => c.key),
  );
  const estadoPorKey = new Map(estados.map((e) => [e.categoriaId, e]));

  const gastados = await prisma.userNode.groupBy({
    by: ['nodeId'],
    where: { profileId: PERFIL },
    _sum: { puntosGastados: true },
  });
  const puntosGastados = gastados.reduce((a, g) => a + (g._sum.puntosGastados ?? 0), 0);

  return {
    hoy,
    nombre: perfil?.nombre ?? 'Yo',
    global: progresoDesdeXp(xpTotal),
    racha: calcularRacha(
      diasConActividad.map((d) => d.diaLogico),
      hoy,
    ),
    puntosLibres: estados.reduce((a, e) => a + e.puntosGanados, 0) - puntosGastados,
    categorias: categorias.map((c) => ({
      key: c.key,
      nombre: c.nombre,
      esfera: c.esfera,
      icono: c.icono,
      activa: c.activa,
      xp: estadoPorKey.get(c.key)?.xp ?? 0,
      nivel: estadoPorKey.get(c.key)?.nivel ?? 1,
      progreso: estadoPorKey.get(c.key)?.progreso.progreso ?? 0,
    })),
  };
}

/** Los ultimos registros, para el pie de Home. */
export async function ultimosRegistros(limite = 5) {
  const logs = await prisma.activityLog.findMany({
    where: { profileId: PERFIL },
    orderBy: { fecha: 'desc' },
    take: limite,
    include: { activity: true, category: true },
  });

  return logs.map((l) => ({
    id: l.id,
    actividad: l.activity.nombre,
    categoria: l.category.nombre,
    esfera: l.category.esfera,
    xp: l.xpCalculado,
    duracionMin: l.duracionMin,
    fecha: l.fecha,
  }));
}
