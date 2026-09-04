/** Forma de los árboles de habilidades. Los árboles son datos, no código. */

export type DefNodo = {
  key: string;
  nombre: string;
  descripcion?: string;
  tier: number;
  maxLevel: number;
  costePuntos: number;
  /** Keys de nodos que deben estar desbloqueados antes. */
  requiere: string[];
  /** Los nodos de maestría no se compran con puntos: se verifican. */
  esMaestria?: boolean;
  retoDescripcion?: string;
};

export type DefRama = {
  key: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  nodos: DefNodo[];
};

export type DefArbol = {
  categoria: string;
  ramas: DefRama[];
};
