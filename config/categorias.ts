/**
 * Las 10 categorías. El color lo asigna la ESFERA, no la categoría: diez
 * colores distintos saturan la pantalla y ninguno significa nada.
 *
 * `activa: false` = definida, visible en la app, pero todavía sin actividades
 * ni ramas. Aparece en el radar de Evolución con nivel 0, no en registro rápido.
 */

export const ESFERAS = {
  interior: { nombre: 'Interior', color: 'teal', acento: '#2dd4bf' },
  expresion: { nombre: 'Expresión', color: 'purpura', acento: '#c084fc' },
  base: { nombre: 'Base', color: 'ambar', acento: '#fbbf24' },
} as const;

export type ClaveEsfera = keyof typeof ESFERAS;

export type DefCategoria = {
  key: string;
  nombre: string;
  esfera: ClaveEsfera;
  icono: string;
  orden: number;
  activa: boolean;
  topeDiarioMin?: number;
};

export const CATEGORIAS: DefCategoria[] = [
  { key: 'fisico', nombre: 'Físico', esfera: 'interior', icono: 'dumbbell', orden: 1, activa: true },
  { key: 'mental', nombre: 'Mental', esfera: 'interior', icono: 'brain', orden: 2, activa: true },
  { key: 'emocional', nombre: 'Emocional', esfera: 'interior', icono: 'heart-pulse', orden: 3, activa: true },
  { key: 'social', nombre: 'Social', esfera: 'expresion', icono: 'users', orden: 4, activa: true },
  { key: 'profesional', nombre: 'Profesional', esfera: 'expresion', icono: 'briefcase', orden: 5, activa: true },
  { key: 'creativo', nombre: 'Creativo', esfera: 'expresion', icono: 'palette', orden: 6, activa: true },
  { key: 'aventura', nombre: 'Aventura', esfera: 'expresion', icono: 'compass', orden: 7, activa: true },
  { key: 'habitos', nombre: 'Hábitos', esfera: 'base', icono: 'sunrise', orden: 8, activa: true },
  { key: 'financiero', nombre: 'Financiero', esfera: 'base', icono: 'piggy-bank', orden: 9, activa: true },
  // Ocio consciente da XP como el resto. No es decorativo: es el contrapeso
  // que evita que esto se convierta en una máquina de ansiedad productiva.
  // Tiene actividades desde el día uno aunque no tenga ramas: si no, la
  // misión diaria de ocio no se podría registrar.
  { key: 'ocio', nombre: 'Ocio consciente', esfera: 'base', icono: 'coffee', orden: 10, activa: true },
];

