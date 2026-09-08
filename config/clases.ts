/**
 * Clases. No las elige el usuario: emergen de dónde puso el esfuerzo, y por
 * eso viven aquí como una tabla y no como una preferencia.
 */

export type TipoClaseDef = 'pura' | 'hibrida' | 'polimata';

export type DefClase = {
  key: string;
  nombre: string;
  tipo: TipoClaseDef;
  /** Una categoría si es pura, dos si es híbrida, ninguna si es polímata. */
  categorias: readonly string[];
  descripcion: string;
};

export const CLASES: DefClase[] = [
  // ── Puras: una categoría por encima del 35% ───────────────────────────
  { key: 'atleta', nombre: 'Atleta', tipo: 'pura', categorias: ['fisico'], descripcion: 'El cuerpo por delante de todo lo demás.' },
  { key: 'erudito', nombre: 'Erudito', tipo: 'pura', categorias: ['mental'], descripcion: 'Saber más hoy que ayer.' },
  { key: 'sabio', nombre: 'Sabio', tipo: 'pura', categorias: ['emocional'], descripcion: 'Gobernarse a uno mismo.' },
  { key: 'diplomatico', nombre: 'Diplomático', tipo: 'pura', categorias: ['social'], descripcion: 'Las personas son el terreno.' },
  { key: 'estratega', nombre: 'Estratega', tipo: 'pura', categorias: ['profesional'], descripcion: 'Construir algo que dure.' },
  { key: 'artesano', nombre: 'Artesano', tipo: 'pura', categorias: ['creativo'], descripcion: 'Hacer cosas que antes no existían.' },
  { key: 'explorador', nombre: 'Explorador', tipo: 'pura', categorias: ['aventura'], descripcion: 'La zona de confort queda lejos.' },
  { key: 'asceta', nombre: 'Asceta', tipo: 'pura', categorias: ['habitos'], descripcion: 'La disciplina como forma de vida.' },
  { key: 'mercader', nombre: 'Mercader', tipo: 'pura', categorias: ['financiero'], descripcion: 'Libertad medida en números.' },

  // ── Híbridas: dos suman más del 55% sin que ninguna llegue al 35% ─────
  { key: 'guerrero-monje', nombre: 'Guerrero-monje', tipo: 'hibrida', categorias: ['fisico', 'mental'], descripcion: 'Cuerpo y cabeza entrenados a la vez.' },
  { key: 'lider', nombre: 'Líder', tipo: 'hibrida', categorias: ['social', 'profesional'], descripcion: 'Mover a otros y mover proyectos.' },
  { key: 'inventor', nombre: 'Inventor', tipo: 'hibrida', categorias: ['creativo', 'mental'], descripcion: 'Ideas que acaban existiendo.' },
  { key: 'nomada', nombre: 'Nómada', tipo: 'hibrida', categorias: ['fisico', 'aventura'], descripcion: 'El mundo se recorre con el cuerpo.' },
  { key: 'arquitecto', nombre: 'Arquitecto', tipo: 'hibrida', categorias: ['financiero', 'profesional'], descripcion: 'Estructuras que se sostienen solas.' },
  { key: 'mentor', nombre: 'Mentor', tipo: 'hibrida', categorias: ['emocional', 'social'], descripcion: 'Entenderse para entender a los demás.' },

  // ── Sin especializar ──────────────────────────────────────────────────
  { key: 'polimata', nombre: 'Polímata', tipo: 'polimata', categorias: [], descripcion: 'Un poco de todo, y a propósito.' },
];

export const UMBRALES_CLASE = {
  /** Por encima de esto, una sola categoría define la clase. */
  pura: 0.35,
  /** Dos categorías que sumen más de esto definen una híbrida. */
  hibrida: 0.55,
  /** Por debajo de esto en todas, Polímata puro. */
  polimata: 0.25,
} as const;

export const CLASE_POLIMATA = 'polimata';
