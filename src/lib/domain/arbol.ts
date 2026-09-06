/**
 * Árbol de habilidades: estados, requisitos, desbloqueo y respec.
 *
 * Dos monedas distintas gobiernan el árbol, y no se mezclan:
 *
 *   · los PUNTOS compran el desbloqueo de un nodo (decides QUE abres)
 *   · la PRACTICA sube su nivel, con la XP registrada en el (decides CUANTO
 *     profundizas)
 *
 * El nivel no se puede comprar porque la dificultad relativa baja al subir de
 * nivel en la skill: pagar puntos para ganar menos XP no lo haria nadie.
 */
import { ECONOMIA } from '@config/economia';
import type { EstadoNodo } from './tipos';

export type NodoArbol = {
  id: string;
  key: string;
  nombre: string;
  descripcion: string | null;
  tier: number;
  maxLevel: number;
  costePuntos: number;
  esMaestria: boolean;
  retoDescripcion: string | null;
  /** Ids de los nodos que hay que tener desbloqueados antes. */
  requiere: string[];
};

export type ProgresoNodo = {
  desbloqueado: boolean;
  /** XP acumulada por actividades que cuelgan de este nodo. */
  xpEnNodo: number;
  maestriaVerificada: boolean;
};

export const SIN_PROGRESO: ProgresoNodo = {
  desbloqueado: false,
  xpEnNodo: 0,
  maestriaVerificada: false,
};

/** XP acumulada que pide alcanzar ese nivel dentro de un nodo. */
export function umbralXpNodo(nivel: number): number {
  if (nivel <= 1) return 0;
  return (ECONOMIA.nodos.xpPorNivel * (nivel - 1) * nivel) / 2;
}

/** Nivel actual del nodo segun la XP practicada en el. */
export function nivelDeNodo(xpEnNodo: number, maxLevel: number): number {
  let nivel = 1;
  while (nivel < maxLevel && xpEnNodo >= umbralXpNodo(nivel + 1)) nivel++;
  return nivel;
}

/** Progreso 0..1 dentro del nivel actual, para la barra del nodo. */
export function progresoDeNodo(xpEnNodo: number, maxLevel: number): number {
  const nivel = nivelDeNodo(xpEnNodo, maxLevel);
  if (nivel >= maxLevel) return 1;
  const desde = umbralXpNodo(nivel);
  const hasta = umbralXpNodo(nivel + 1);
  return Math.min(1, Math.max(0, (xpEnNodo - desde) / (hasta - desde)));
}

/**
 * Requisito cumplido = el nodo exigido esta DESBLOQUEADO, no dominado.
 * Exigir dominio completo de los dos nodos de tier 1 para tocar el tier 2
 * convertiria el arbol en un muro.
 */
export function requisitosPendientes(
  nodo: NodoArbol,
  progresos: Record<string, ProgresoNodo>,
): string[] {
  return nodo.requiere.filter((id) => !progresos[id]?.desbloqueado);
}

export function estadoDeNodo(
  nodo: NodoArbol,
  progresos: Record<string, ProgresoNodo>,
): EstadoNodo {
  const propio = progresos[nodo.id] ?? SIN_PROGRESO;
  const faltan = requisitosPendientes(nodo, progresos);

  // La maestria no se compra: o esta verificada, o esta a la espera del reto.
  if (nodo.esMaestria) {
    if (propio.maestriaVerificada) return 'dominado';
    return faltan.length > 0 ? 'bloqueado' : 'disponible';
  }

  if (!propio.desbloqueado) return faltan.length > 0 ? 'bloqueado' : 'disponible';
  return nivelDeNodo(propio.xpEnNodo, nodo.maxLevel) >= nodo.maxLevel
    ? 'dominado'
    : 'en-progreso';
}

export type VeredictoDesbloqueo =
  | { puede: true }
  | { puede: false; motivo: 'ya-desbloqueado' | 'requisitos' | 'puntos' | 'maestria'; detalle: string };

export function puedeDesbloquear(
  nodo: NodoArbol,
  progresos: Record<string, ProgresoNodo>,
  puntosLibres: number,
): VeredictoDesbloqueo {
  if (nodo.esMaestria) {
    return {
      puede: false,
      motivo: 'maestria',
      detalle: 'Este nodo no se compra con puntos: se demuestra.',
    };
  }
  if (progresos[nodo.id]?.desbloqueado) {
    return { puede: false, motivo: 'ya-desbloqueado', detalle: 'Ya lo tienes desbloqueado.' };
  }

  const faltan = requisitosPendientes(nodo, progresos);
  if (faltan.length > 0) {
    return {
      puede: false,
      motivo: 'requisitos',
      detalle: `Te faltan ${faltan.length} nodo(s) previos.`,
    };
  }
  if (puntosLibres < nodo.costePuntos) {
    return {
      puede: false,
      motivo: 'puntos',
      detalle: `Necesitas ${nodo.costePuntos} puntos y tienes ${puntosLibres}.`,
    };
  }
  return { puede: true };
}

/** La maestria pide requisitos cumplidos y una prueba escrita, no un toque. */
export function puedeVerificarMaestria(
  nodo: NodoArbol,
  progresos: Record<string, ProgresoNodo>,
  evidencia: string,
): VeredictoDesbloqueo {
  if (!nodo.esMaestria) {
    return { puede: false, motivo: 'maestria', detalle: 'Este nodo no es de maestria.' };
  }
  if (progresos[nodo.id]?.maestriaVerificada) {
    return { puede: false, motivo: 'ya-desbloqueado', detalle: 'Ya la tienes verificada.' };
  }
  const faltan = requisitosPendientes(nodo, progresos);
  if (faltan.length > 0) {
    return { puede: false, motivo: 'requisitos', detalle: 'Aun te faltan nodos previos.' };
  }
  if (evidencia.trim().length < 10) {
    return {
      puede: false,
      motivo: 'maestria',
      detalle: 'Describe la prueba: sin evidencia esto seria regalarse el nodo.',
    };
  }
  return { puede: true };
}

/** Puntos que devolveria un respec: todo lo invertido en esos nodos. */
export function puntosARecuperar(
  nodos: readonly NodoArbol[],
  progresos: Record<string, ProgresoNodo>,
): number {
  return nodos
    .filter((n) => !n.esMaestria && progresos[n.id]?.desbloqueado)
    .reduce((total, n) => total + n.costePuntos, 0);
}

export type EstadoRespec = {
  disponible: boolean;
  diasRestantes: number;
};

/**
 * Un respec cada 90 dias por categoria. Existe para quitar el miedo a
 * elegir mal, no para reoptimizar cada semana.
 */
export function estadoRespec(ultimoRespec: Date | null, ahora: Date): EstadoRespec {
  if (!ultimoRespec) return { disponible: true, diasRestantes: 0 };
  const dias = Math.floor((ahora.getTime() - ultimoRespec.getTime()) / 86_400_000);
  const restantes = ECONOMIA.diasEntreRespec - dias;
  return { disponible: restantes <= 0, diasRestantes: Math.max(0, restantes) };
}
