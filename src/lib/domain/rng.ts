/**
 * Generador pseudoaleatorio con semilla. La aleatoriedad del juego (misiones
 * del dia, mision sorpresa, contenido de los cofres) tiene que ser
 * REPRODUCIBLE: se siembra con la fecha, asi el resultado es el mismo aunque
 * la peticion se repita, no hace falta un cron y los tests son deterministas.
 */

export function hashCadena(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export type Aleatorio = {
  /** Numero en [0, 1). */
  siguiente: () => number;
  entero: (minIncl: number, maxExcl: number) => number;
  /** Devuelve una copia barajada, sin mutar la entrada. */
  barajar: <T>(items: readonly T[]) => T[];
  elegir: <T>(items: readonly T[]) => T;
  /** true con probabilidad p. */
  oportunidad: (p: number) => boolean;
};

export function crearAleatorio(semilla: string | number): Aleatorio {
  let a = (typeof semilla === 'number' ? semilla : hashCadena(semilla)) >>> 0;

  // mulberry32
  const siguiente = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const entero = (minIncl: number, maxExcl: number) =>
    minIncl + Math.floor(siguiente() * (maxExcl - minIncl));

  function barajar<T>(items: readonly T[]): T[] {
    const copia = [...items];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = entero(0, i + 1);
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  return {
    siguiente,
    entero,
    barajar,
    elegir: <T,>(items: readonly T[]) => items[entero(0, items.length)],
    oportunidad: (p: number) => siguiente() < p,
  };
}
