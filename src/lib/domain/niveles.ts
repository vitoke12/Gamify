/**
 * Curva de niveles.
 *
 * `xpParaSubirDeNivel(n)` es el coste de pasar del nivel n al n+1:
 *
 *     round(80 * n^1.8)
 *
 * Con esos parametros el nivel 1 cuesta 80 XP (los primeros niveles caen en
 * una sola sesion, que es lo que engancha el primer dia) y el 15 cuesta
 * 10.486 (compromiso real). Un jugador empieza en nivel 1 con 0 XP.
 *
 * La misma curva se usa para el nivel de cada categoria y para el nivel
 * global, que se deriva de la XP total.
 */
import { ECONOMIA } from '@config/economia';

const NIVEL_MAXIMO = 200;

export function xpParaSubirDeNivel(nivel: number): number {
  if (nivel < 1) return 0;
  return Math.round(ECONOMIA.curva.base * Math.pow(nivel, ECONOMIA.curva.exponente));
}

// acumulado[n] = XP total necesaria para ESTAR en el nivel n. acumulado[1] = 0.
const acumulado: number[] = [0, 0];

function acumuladoHasta(nivel: number): number {
  for (let n = acumulado.length; n <= nivel; n++) {
    acumulado[n] = acumulado[n - 1] + xpParaSubirDeNivel(n - 1);
  }
  return acumulado[nivel];
}

/** XP total acumulada necesaria para alcanzar ese nivel. */
export function xpAcumuladaParaNivel(nivel: number): number {
  if (nivel <= 1) return 0;
  return acumuladoHasta(Math.min(nivel, NIVEL_MAXIMO));
}

export type Progreso = {
  nivel: number;
  xpTotal: number;
  /** XP acumulada dentro del nivel actual. */
  xpEnNivel: number;
  /** Coste total del nivel actual. */
  xpParaSiguienteNivel: number;
  /** Lo que falta para subir. Es el numero que va arriba del todo en Home. */
  xpRestante: number;
  /** 0..1 */
  progreso: number;
};

export function progresoDesdeXp(xpTotal: number): Progreso {
  const xp = Math.max(0, Math.floor(xpTotal));
  let nivel = 1;
  while (nivel < NIVEL_MAXIMO && xp >= xpAcumuladaParaNivel(nivel + 1)) {
    nivel++;
  }
  const base = xpAcumuladaParaNivel(nivel);
  const coste = xpParaSubirDeNivel(nivel);
  const xpEnNivel = xp - base;
  return {
    nivel,
    xpTotal: xp,
    xpEnNivel,
    xpParaSiguienteNivel: coste,
    xpRestante: Math.max(0, coste - xpEnNivel),
    progreso: coste > 0 ? Math.min(1, xpEnNivel / coste) : 1,
  };
}

export function nivelDesdeXp(xpTotal: number): number {
  return progresoDesdeXp(xpTotal).nivel;
}

/**
 * Puntos de habilidad ganados por haber alcanzado ese nivel en una categoria.
 * Se otorga 1 por nivel, y el nivel 1 es el punto de partida: no da puntos.
 */
export function puntosPorNivelAlcanzado(nivel: number): number {
  return Math.max(0, nivel - 1) * ECONOMIA.puntosPorNivel;
}
