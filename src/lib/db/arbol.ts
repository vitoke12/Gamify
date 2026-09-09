/**
 * Lectura del árbol de habilidades. Traduce las filas a los tipos planos que
 * consume /lib/domain/arbol y devuelve la vista ya resuelta: la UI no calcula
 * estados, solo los pinta.
 */
import {
  estadoDeNodo,
  estadoRespec,
  nivelDeNodo,
  progresoDeNodo,
  puedeDesbloquear,
  requisitosPendientes,
  type EstadoRespec,
  type NodoArbol,
  type ProgresoNodo,
} from '@/lib/domain/arbol';
import { progresoDesdeXp, puntosPorNivelAlcanzado } from '@/lib/domain/niveles';
import type { EstadoNodo } from '@/lib/domain/tipos';
import { PERFIL, prisma } from './prisma';
import { xpPorCategoria } from './consultas';

/** XP acumulada en cada nodo, por las actividades que cuelgan de él. */
export async function xpPorNodo(): Promise<Record<string, number>> {
  const [filas, actividades] = await Promise.all([
    prisma.activityLog.groupBy({
      by: ['activityId'],
      where: { profileId: PERFIL },
      _sum: { xpCalculado: true },
    }),
    prisma.activity.findMany({ select: { id: true, nodeId: true } }),
  ]);

  const nodoPorActividad = new Map(actividades.map((a) => [a.id, a.nodeId]));
  const salida: Record<string, number> = {};
  for (const fila of filas) {
    const nodeId = nodoPorActividad.get(fila.activityId);
    if (!nodeId) continue;
    salida[nodeId] = (salida[nodeId] ?? 0) + (fila._sum.xpCalculado ?? 0);
  }
  return salida;
}

export type NodoVista = {
  id: string;
  key: string;
  nombre: string;
  descripcion: string | null;
  tier: number;
  nivel: number;
  maxLevel: number;
  costePuntos: number;
  esMaestria: boolean;
  retoDescripcion: string | null;
  estado: EstadoNodo;
  xpEnNodo: number;
  progreso: number;
  /** Nombres legibles de lo que falta. Un nodo bloqueado dice por qué. */
  faltan: string[];
  /** Ids de los nodos de los que cuelga. Son las aristas de la constelación. */
  requiere: string[];
  comprable: boolean;
};

export type RamaVista = {
  id: string;
  key: string;
  nombre: string;
  descripcion: string | null;
  nodos: NodoVista[];
};

export type ArbolVista = {
  categoria: { key: string; nombre: string; esfera: string; icono: string; nivel: number; xp: number };
  puntos: { ganados: number; gastados: number; libres: number };
  respec: EstadoRespec & { nodosComprados: number };
  ramas: RamaVista[];
};

/** Categorías que tienen árbol, para las pestañas. */
export async function categoriasConArbol() {
  const categorias = await prisma.category.findMany({
    where: { branches: { some: {} } },
    orderBy: { orden: 'asc' },
    select: { key: true, nombre: true, esfera: true, icono: true },
  });
  return categorias;
}

export async function arbolDeCategoria(categoriaKey: string): Promise<ArbolVista | null> {
  const categoria = await prisma.category.findUnique({
    where: { key: categoriaKey },
    include: {
      branches: {
        orderBy: { orden: 'asc' },
        include: {
          nodes: {
            orderBy: [{ tier: 'asc' }, { orden: 'asc' }],
            include: { requisitos: true },
          },
        },
      },
    },
  });
  if (!categoria) return null;

  const [nodosUsuario, xpNodos, xpCategorias, ultimoRespec] = await Promise.all([
    prisma.userNode.findMany({ where: { profileId: PERFIL } }),
    xpPorNodo(),
    xpPorCategoria(),
    prisma.respecEvent.findFirst({
      where: { profileId: PERFIL, categoryId: categoria.id },
      orderBy: { realizadoEn: 'desc' },
    }),
  ]);

  const usuarioPorNodo = new Map(nodosUsuario.map((n) => [n.nodeId, n]));

  // El progreso se monta con TODOS los nodos del perfil, no solo los de esta
  // categoría: un requisito podría vivir en otra rama.
  const progresos: Record<string, ProgresoNodo> = {};
  for (const [nodeId, un] of usuarioPorNodo) {
    progresos[nodeId] = {
      desbloqueado: true,
      xpEnNodo: xpNodos[nodeId] ?? 0,
      maestriaVerificada: Boolean(un.maestriaVerificadaEn),
    };
  }

  const nombrePorId = new Map<string, string>();
  for (const rama of categoria.branches) {
    for (const n of rama.nodes) nombrePorId.set(n.id, n.nombre);
  }

  const nivelCategoria = progresoDesdeXp(xpCategorias[categoria.key] ?? 0).nivel;
  const ganados = puntosPorNivelAlcanzado(nivelCategoria);

  const idsDeLaCategoria = new Set(
    categoria.branches.flatMap((r) => r.nodes.map((n) => n.id)),
  );
  const gastados = nodosUsuario
    .filter((n) => idsDeLaCategoria.has(n.nodeId))
    .reduce((total, n) => total + n.puntosGastados, 0);
  const libres = ganados - gastados;

  const ramas: RamaVista[] = categoria.branches.map((rama) => ({
    id: rama.id,
    key: rama.key,
    nombre: rama.nombre,
    descripcion: rama.descripcion,
    nodos: rama.nodes.map((n) => {
      const nodo: NodoArbol = {
        id: n.id,
        key: n.key,
        nombre: n.nombre,
        descripcion: n.descripcion,
        tier: n.tier,
        maxLevel: n.maxLevel,
        costePuntos: n.costePuntos,
        esMaestria: n.esMaestria,
        retoDescripcion: n.retoDescripcion,
        requiere: n.requisitos.map((r) => r.requisitoId),
      };
      const propio = progresos[n.id];
      const xpEnNodo = xpNodos[n.id] ?? 0;

      return {
        id: n.id,
        key: n.key,
        nombre: n.nombre,
        descripcion: n.descripcion,
        tier: n.tier,
        nivel: propio?.desbloqueado ? nivelDeNodo(xpEnNodo, n.maxLevel) : 0,
        maxLevel: n.maxLevel,
        costePuntos: n.costePuntos,
        esMaestria: n.esMaestria,
        retoDescripcion: n.retoDescripcion,
        estado: estadoDeNodo(nodo, progresos),
        xpEnNodo,
        progreso: propio?.desbloqueado ? progresoDeNodo(xpEnNodo, n.maxLevel) : 0,
        faltan: requisitosPendientes(nodo, progresos).map(
          (id) => nombrePorId.get(id) ?? 'otro nodo',
        ),
        requiere: nodo.requiere,
        comprable: puedeDesbloquear(nodo, progresos, libres).puede,
      } satisfies NodoVista;
    }),
  }));

  const nodosComprados = nodosUsuario.filter(
    (n) => idsDeLaCategoria.has(n.nodeId) && n.puntosGastados > 0,
  ).length;

  return {
    categoria: {
      key: categoria.key,
      nombre: categoria.nombre,
      esfera: categoria.esfera,
      icono: categoria.icono,
      nivel: nivelCategoria,
      xp: xpCategorias[categoria.key] ?? 0,
    },
    puntos: { ganados, gastados, libres },
    respec: {
      ...estadoRespec(ultimoRespec?.realizadoEn ?? null, new Date()),
      nodosComprados,
    },
    ramas,
  };
}
