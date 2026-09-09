/**
 * Derivaciones del perfil a partir de la XP acumulada. Aqui no se guarda
 * nada: nivel, puntos y desequilibrio se calculan cada vez desde el libro
 * mayor de XP, que es lo que permite cambiar la formula y recalcular.
 */
import { progresoDesdeXp, puntosPorNivelAlcanzado, type Progreso } from './niveles';

export type EstadoCategoria = {
  categoriaId: string;
  xp: number;
  nivel: number;
  progreso: Progreso;
  puntosGanados: number;
};

export function estadoDeCategorias(
  xpPorCategoria: Record<string, number>,
  categorias: readonly string[],
): EstadoCategoria[] {
  return categorias.map((categoriaId) => {
    const xp = xpPorCategoria[categoriaId] ?? 0;
    const progreso = progresoDesdeXp(xp);
    return {
      categoriaId,
      xp,
      nivel: progreso.nivel,
      progreso,
      puntosGanados: puntosPorNivelAlcanzado(progreso.nivel),
    };
  });
}

/**
 * Cuota de cada categoria respecto a la media: 1 es ir justo en la media, 0
 * es no haberla tocado. Es lo que alimenta el empuje al equilibrio.
 *
 * Con todo a cero devuelve 1 para todas: el primer dia no hay nada
 * descuidado, solo una app recien abierta.
 */
export function cuotasRelativas(
  xpPorCategoria: Record<string, number>,
  categoriasActivas: readonly string[],
): Record<string, number> {
  const salida: Record<string, number> = {};
  if (categoriasActivas.length === 0) return salida;

  const total = categoriasActivas.reduce((a, c) => a + (xpPorCategoria[c] ?? 0), 0);
  const media = total / categoriasActivas.length;

  for (const c of categoriasActivas) {
    salida[c] = media > 0 ? (xpPorCategoria[c] ?? 0) / media : 1;
  }
  return salida;
}

/** Puntos de habilidad disponibles: los ganados por niveles menos los gastados. */
export function puntosDisponibles(
  estados: readonly EstadoCategoria[],
  puntosGastadosPorCategoria: Record<string, number>,
): Record<string, number> {
  const salida: Record<string, number> = {};
  for (const e of estados) {
    salida[e.categoriaId] = e.puntosGanados - (puntosGastadosPorCategoria[e.categoriaId] ?? 0);
  }
  return salida;
}

/**
 * Frase de contexto para la barra de progreso de Home. Estar cerca de
 * completar es el disparador de accion mas potente del sistema, asi que el
 * numero que falta se dice en terminos de esfuerzo real, no solo en XP.
 */
export function fraseDeContexto(progreso: Progreso, xpPorSesionTipica = 180): string {
  if (progreso.xpRestante === 0) return 'Nivel completo. El siguiente ya esta en marcha.';
  const sesiones = progreso.xpRestante / xpPorSesionTipica;
  const falta = progreso.xpRestante.toLocaleString('es-ES');
  if (sesiones <= 0.35) return `te faltan ${falta} XP, lo cierras en un rato`;
  if (sesiones <= 1.2) return `te faltan ${falta} XP, una sesion larga lo cierra`;
  if (sesiones <= 3) return `te faltan ${falta} XP, unas ${Math.ceil(sesiones)} sesiones`;
  return `te faltan ${falta} XP, esto es cosa de varias semanas`;
}
