import { ARBOL_FISICO } from './fisico';
import { ARBOL_MENTAL } from './mental';
import { ARBOL_HABITOS } from './habitos';
import type { DefArbol } from './tipos';

/**
 * Solo tres árboles vivos en el seed inicial. Las otras siete categorías
 * existen en config con las ramas vacías: un árbol enorme y vacío se siente
 * muerto, tres árboles llenos se sienten un juego.
 */
export const ARBOLES: DefArbol[] = [ARBOL_FISICO, ARBOL_MENTAL, ARBOL_HABITOS];

export type { DefArbol, DefRama, DefNodo } from './tipos';
