/**
 * Escrituras del árbol: desbloquear, verificar maestría y respec.
 *
 * Vive fuera del server action, como el registro: aquí no hay nada de Next.
 * Las reglas están en /lib/domain/arbol y aquí solo se aplican, siempre
 * revalidándolas contra la base — un cliente manipulado no puede saltárselas.
 */
import {
  nivelDeNodo,
  puedeDesbloquear,
  puedeVerificarMaestria,
  puntosARecuperar,
  estadoRespec,
  type NodoArbol,
  type ProgresoNodo,
} from '@/lib/domain/arbol';
import { progresoDesdeXp, puntosPorNivelAlcanzado } from '@/lib/domain/niveles';
import { PERFIL, prisma } from './prisma';
import { xpPorCategoria } from './consultas';
import { xpPorNodo } from './arbol';
import { aJson } from './json';

export type ResultadoArbol =
  | { ok: true; mensaje: string; puntosLibres: number }
  | { ok: false; error: string };

type Contexto = {
  nodo: NodoArbol;
  progresos: Record<string, ProgresoNodo>;
  libres: number;
  categoriaId: string;
  categoriaKey: string;
  nodosDeLaCategoria: NodoArbol[];
};

async function contextoDeNodo(nodoId: string): Promise<Contexto | null> {
  const fila = await prisma.skillNode.findUnique({
    where: { id: nodoId },
    include: { requisitos: true, branch: { include: { category: true } } },
  });
  if (!fila) return null;
  return contextoDeCategoria(fila.branch.category.id, fila.branch.category.key, fila.id);
}

async function contextoDeCategoria(
  categoriaId: string,
  categoriaKey: string,
  nodoEnfocado?: string,
): Promise<Contexto | null> {
  const [nodosDb, nodosUsuario, xpNodos, xpCategorias] = await Promise.all([
    prisma.skillNode.findMany({
      where: { branch: { categoryId: categoriaId } },
      include: { requisitos: true },
    }),
    prisma.userNode.findMany({ where: { profileId: PERFIL } }),
    xpPorNodo(),
    xpPorCategoria(),
  ]);

  const aDominio = (n: (typeof nodosDb)[number]): NodoArbol => ({
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
  });

  const progresos: Record<string, ProgresoNodo> = {};
  for (const un of nodosUsuario) {
    progresos[un.nodeId] = {
      desbloqueado: true,
      xpEnNodo: xpNodos[un.nodeId] ?? 0,
      maestriaVerificada: Boolean(un.maestriaVerificadaEn),
    };
  }

  const ids = new Set(nodosDb.map((n) => n.id));
  const ganados = puntosPorNivelAlcanzado(progresoDesdeXp(xpCategorias[categoriaKey] ?? 0).nivel);
  const gastados = nodosUsuario
    .filter((n) => ids.has(n.nodeId))
    .reduce((total, n) => total + n.puntosGastados, 0);

  const enfocado = nodoEnfocado ? nodosDb.find((n) => n.id === nodoEnfocado) : nodosDb[0];
  if (!enfocado) return null;

  return {
    nodo: aDominio(enfocado),
    progresos,
    libres: ganados - gastados,
    categoriaId,
    categoriaKey,
    nodosDeLaCategoria: nodosDb.map(aDominio),
  };
}

export async function aplicarDesbloqueo(nodoId: string): Promise<ResultadoArbol> {
  const ctx = await contextoDeNodo(nodoId);
  if (!ctx) return { ok: false, error: 'Ese nodo no existe' };

  const veredicto = puedeDesbloquear(ctx.nodo, ctx.progresos, ctx.libres);
  if (!veredicto.puede) return { ok: false, error: veredicto.detalle };

  const xpNodos = await xpPorNodo();
  await prisma.userNode.create({
    data: {
      nodeId: ctx.nodo.id,
      puntosGastados: ctx.nodo.costePuntos,
      nivelActual: nivelDeNodo(xpNodos[ctx.nodo.id] ?? 0, ctx.nodo.maxLevel),
    },
  });

  return {
    ok: true,
    mensaje: `${ctx.nodo.nombre} desbloqueado`,
    puntosLibres: ctx.libres - ctx.nodo.costePuntos,
  };
}

export async function aplicarVerificacionMaestria(
  nodoId: string,
  evidencia: string,
): Promise<ResultadoArbol> {
  const ctx = await contextoDeNodo(nodoId);
  if (!ctx) return { ok: false, error: 'Ese nodo no existe' };

  const veredicto = puedeVerificarMaestria(ctx.nodo, ctx.progresos, evidencia);
  if (!veredicto.puede) return { ok: false, error: veredicto.detalle };

  await prisma.userNode.upsert({
    where: { profileId_nodeId: { profileId: PERFIL, nodeId: ctx.nodo.id } },
    update: { maestriaVerificadaEn: new Date(), maestriaEvidenciaUrl: evidencia.trim() },
    create: {
      nodeId: ctx.nodo.id,
      puntosGastados: 0,
      nivelActual: 1,
      maestriaVerificadaEn: new Date(),
      maestriaEvidenciaUrl: evidencia.trim(),
    },
  });

  return { ok: true, mensaje: `Maestría verificada: ${ctx.nodo.nombre}`, puntosLibres: ctx.libres };
}

/**
 * Respec: devuelve los puntos gastados en la categoría y conserva la XP.
 * Los nodos de maestría no se tocan: no se compraron con puntos y se ganaron
 * demostrando algo, así que devolverlos al montón no tendría sentido.
 */
export async function aplicarRespec(categoriaKey: string): Promise<ResultadoArbol> {
  const categoria = await prisma.category.findUnique({ where: { key: categoriaKey } });
  if (!categoria) return { ok: false, error: 'Esa categoría no existe' };

  const ultimo = await prisma.respecEvent.findFirst({
    where: { profileId: PERFIL, categoryId: categoria.id },
    orderBy: { realizadoEn: 'desc' },
  });
  const estado = estadoRespec(ultimo?.realizadoEn ?? null, new Date());
  if (!estado.disponible) {
    return { ok: false, error: `Faltan ${estado.diasRestantes} días para poder volver a hacerlo` };
  }

  const ctx = await contextoDeCategoria(categoria.id, categoria.key);
  if (!ctx) return { ok: false, error: 'Esa categoría no tiene árbol' };

  const devueltos = puntosARecuperar(ctx.nodosDeLaCategoria, ctx.progresos);
  if (devueltos === 0) return { ok: false, error: 'No has gastado ningún punto aquí todavía' };

  const aBorrar = ctx.nodosDeLaCategoria
    .filter((n) => !n.esMaestria && ctx.progresos[n.id]?.desbloqueado)
    .map((n) => n.id);

  await prisma.$transaction(async (tx) => {
    await tx.userNode.deleteMany({ where: { profileId: PERFIL, nodeId: { in: aBorrar } } });
    await tx.respecEvent.create({
      data: {
        categoryId: categoria.id,
        puntosDevueltos: devueltos,
        nodosJson: aJson(aBorrar),
      },
    });
  });

  return {
    ok: true,
    mensaje: `${devueltos} puntos devueltos. La XP se queda donde estaba.`,
    puntosLibres: ctx.libres + devueltos,
  };
}
