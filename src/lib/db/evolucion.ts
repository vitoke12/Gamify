/**
 * Datos de la pantalla de Evolución. La comparación es SIEMPRE contra uno
 * mismo: aquí no entra nadie más, ni ahora ni cuando haya pestaña social.
 */
import { progresoDesdeXp } from '@/lib/domain/niveles';
import { PERFIL, prisma } from './prisma';
import { diaDeHoy } from './consultas';

/** XP acumulada por categoría hasta un día lógico (incluido). */
async function xpHasta(dia: string): Promise<Record<string, number>> {
  const [filas, categorias] = await Promise.all([
    prisma.xpEntry.groupBy({
      by: ['categoryId'],
      where: { profileId: PERFIL, diaLogico: { lte: dia } },
      _sum: { xp: true },
    }),
    prisma.category.findMany({ select: { id: true, key: true } }),
  ]);
  const keyPorId = new Map(categorias.map((c) => [c.id, c.key]));

  const salida: Record<string, number> = {};
  for (const c of categorias) salida[c.key] = 0;
  for (const f of filas) {
    const key = keyPorId.get(f.categoryId);
    if (key) salida[key] = f._sum.xp ?? 0;
  }
  return salida;
}

function restarMeses(dia: string, meses: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  const t = new Date(a, m - 1 - meses, d);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}

export type FilaComparativa = {
  categoria: string;
  nombre: string;
  esfera: string;
  nivelAhora: number;
  nivelAntes: number;
  xpAhora: number;
  xpAntes: number;
};

/** Tú contra tú de hace N meses. */
export async function comparativa(mesesAtras: number): Promise<FilaComparativa[]> {
  const hoy = await diaDeHoy();
  const [ahora, antes, categorias] = await Promise.all([
    xpHasta(hoy),
    xpHasta(restarMeses(hoy, mesesAtras)),
    prisma.category.findMany({ orderBy: { orden: 'asc' } }),
  ]);

  return categorias.map((c) => ({
    categoria: c.key,
    nombre: c.nombre,
    esfera: c.esfera,
    nivelAhora: progresoDesdeXp(ahora[c.key] ?? 0).nivel,
    nivelAntes: progresoDesdeXp(antes[c.key] ?? 0).nivel,
    xpAhora: ahora[c.key] ?? 0,
    xpAntes: antes[c.key] ?? 0,
  }));
}

export type PuntoLinea = { dia: string; xp: number };

/** Línea temporal de XP acumulada, día a día. */
export async function lineaDeXp(): Promise<PuntoLinea[]> {
  const filas = await prisma.xpEntry.groupBy({
    by: ['diaLogico'],
    where: { profileId: PERFIL },
    _sum: { xp: true },
    orderBy: { diaLogico: 'asc' },
  });

  let acumulado = 0;
  return filas.map((f) => {
    acumulado += f._sum.xp ?? 0;
    return { dia: f.diaLogico, xp: acumulado };
  });
}

/** Minutos registrados por categoría en los últimos N días. */
export async function repartoDeTiempo(dias = 30) {
  const hoy = await diaDeHoy();
  const desde = restarMeses(hoy, 0);
  const [a, m, d] = desde.split('-').map(Number);
  const inicio = new Date(a, m - 1, d - dias);
  const p = (x: number) => String(x).padStart(2, '0');
  const clave = `${inicio.getFullYear()}-${p(inicio.getMonth() + 1)}-${p(inicio.getDate())}`;

  const logs = await prisma.activityLog.findMany({
    where: { profileId: PERFIL, diaLogico: { gte: clave } },
    include: { category: { select: { nombre: true, esfera: true, key: true } } },
  });

  const porCategoria = new Map<string, { nombre: string; esfera: string; minutos: number }>();
  for (const l of logs) {
    const actual = porCategoria.get(l.category.key) ?? {
      nombre: l.category.nombre,
      esfera: l.category.esfera,
      minutos: 0,
    };
    actual.minutos += l.duracionMin;
    porCategoria.set(l.category.key, actual);
  }

  return [...porCategoria.entries()]
    .map(([key, v]) => ({ key, ...v, minutos: Math.round(v.minutos) }))
    .sort((x, y) => y.minutos - x.minutos);
}
