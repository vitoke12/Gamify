/**
 * Evaluación de logros. El catálogo vive en /config: aquí solo se comprueba
 * si el estado del perfil cumple cada condición.
 */
import type { CondicionLogro, DefLogro } from '@config/logros';

export type EstadoParaLogros = {
  registros: number;
  rachaMaxima: number;
  nivelGlobal: number;
  nivelPorCategoria: Record<string, number>;
  maxCategoriasEnUnDia: number;
  nodosDesbloqueados: number;
  maestrias: number;
  misionesCompletadas: number;
  semanalesCompletadas: number;
  registrosDeOcio: number;
  registrosAntesDeLas7: number;
  registrosDespuesDeLas23: number;
};

export const ESTADO_VACIO: EstadoParaLogros = {
  registros: 0,
  rachaMaxima: 0,
  nivelGlobal: 1,
  nivelPorCategoria: {},
  maxCategoriasEnUnDia: 0,
  nodosDesbloqueados: 0,
  maestrias: 0,
  misionesCompletadas: 0,
  semanalesCompletadas: 0,
  registrosDeOcio: 0,
  registrosAntesDeLas7: 0,
  registrosDespuesDeLas23: 0,
};

export function cumple(condicion: CondicionLogro, estado: EstadoParaLogros): boolean {
  switch (condicion.tipo) {
    case 'registros':
      return estado.registros >= condicion.valor;
    case 'rachaMaxima':
      return estado.rachaMaxima >= condicion.valor;
    case 'nivelGlobal':
      return estado.nivelGlobal >= condicion.valor;
    case 'nivelCategoria':
      return (estado.nivelPorCategoria[condicion.categoria] ?? 1) >= condicion.valor;
    case 'nivelEnVarias':
      return condicion.categorias.every(
        (c) => (estado.nivelPorCategoria[c] ?? 1) >= condicion.valor,
      );
    case 'categoriasEnUnDia':
      return estado.maxCategoriasEnUnDia >= condicion.valor;
    case 'nodosDesbloqueados':
      return estado.nodosDesbloqueados >= condicion.valor;
    case 'maestrias':
      return estado.maestrias >= condicion.valor;
    case 'misionesCompletadas':
      return estado.misionesCompletadas >= condicion.valor;
    case 'semanalesCompletadas':
      return estado.semanalesCompletadas >= condicion.valor;
    case 'registrosDeOcio':
      return estado.registrosDeOcio >= condicion.valor;
    case 'registrosAntesDeLas7':
      return estado.registrosAntesDeLas7 >= condicion.valor;
    case 'registrosDespuesDeLas23':
      return estado.registrosDespuesDeLas23 >= condicion.valor;
  }
}

/** Keys de los logros que el estado ya cumple. */
export function logrosCumplidos(
  catalogo: readonly DefLogro[],
  estado: EstadoParaLogros,
): string[] {
  return catalogo.filter((l) => cumple(l.condicion, estado)).map((l) => l.key);
}

/** Los que cumple y todavía no tenía: son los que hay que celebrar. */
export function logrosNuevos(
  catalogo: readonly DefLogro[],
  estado: EstadoParaLogros,
  yaDesbloqueados: ReadonlySet<string>,
): string[] {
  return logrosCumplidos(catalogo, estado).filter((k) => !yaDesbloqueados.has(k));
}
