import { ARBOL_FISICO } from './fisico';
import { ARBOL_MENTAL } from './mental';
import { ARBOL_HABITOS } from './habitos';
import { ARBOL_EMOCIONAL } from './emocional';
import { ARBOL_SOCIAL } from './social';
import { ARBOL_PROFESIONAL } from './profesional';
import { ARBOL_CREATIVO } from './creativo';
import { ARBOL_AVENTURA } from './aventura';
import { ARBOL_FINANCIERO } from './financiero';
import type { DefArbol } from './tipos';

/**
 * Las nueve categorias con escalera propia. Ocio consciente se queda sin
 * arbol a proposito: descansar no es una progresion por tiers, y fingir que
 * lo es seria mentir con la forma.
 */
export const ARBOLES: DefArbol[] = [
  ARBOL_FISICO,
  ARBOL_MENTAL,
  ARBOL_EMOCIONAL,
  ARBOL_SOCIAL,
  ARBOL_PROFESIONAL,
  ARBOL_CREATIVO,
  ARBOL_AVENTURA,
  ARBOL_HABITOS,
  ARBOL_FINANCIERO,
];

export type { DefArbol, DefRama, DefNodo } from './tipos';
