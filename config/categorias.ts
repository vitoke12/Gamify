/**
 * Las 10 categorías. El color lo asigna la ESFERA, no la categoría: diez
 * colores distintos saturan la pantalla y ninguno significa nada.
 *
 * `topeDiarioMin` no es un capricho por categoría: está puesto para que el
 * TECHO DIARIO DE XP sea el mismo en las diez (tope × ritmo más caro de sus
 * actividades = 540). Sin eso, una categoría que se mide en actos caros
 * podría ganar el doble por día que una que se mide en ratos, o al revés.
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
  { key: 'fisico', nombre: 'Físico', esfera: 'interior', icono: 'dumbbell', orden: 1, activa: true, topeDiarioMin: 180 },
  { key: 'mental', nombre: 'Mental', esfera: 'interior', icono: 'brain', orden: 2, activa: true, topeDiarioMin: 180 },
  { key: 'emocional', nombre: 'Emocional', esfera: 'interior', icono: 'heart-pulse', orden: 3, activa: true, topeDiarioMin: 90 },
  { key: 'social', nombre: 'Social', esfera: 'expresion', icono: 'users', orden: 4, activa: true, topeDiarioMin: 90 },
  { key: 'profesional', nombre: 'Profesional', esfera: 'expresion', icono: 'briefcase', orden: 5, activa: true, topeDiarioMin: 180 },
  { key: 'creativo', nombre: 'Creativo', esfera: 'expresion', icono: 'palette', orden: 6, activa: true, topeDiarioMin: 180 },
  { key: 'aventura', nombre: 'Aventura', esfera: 'expresion', icono: 'compass', orden: 7, activa: true, topeDiarioMin: 180 },
  { key: 'habitos', nombre: 'Hábitos', esfera: 'base', icono: 'sunrise', orden: 8, activa: true, topeDiarioMin: 180 },
  { key: 'financiero', nombre: 'Financiero', esfera: 'base', icono: 'piggy-bank', orden: 9, activa: true, topeDiarioMin: 90 },
  // Ocio consciente da XP como el resto. No es decorativo: es el contrapeso
  // que evita que esto se convierta en una máquina de ansiedad productiva.
  // Tiene actividades desde el día uno aunque no tenga ramas: si no, la
  // misión diaria de ocio no se podría registrar.
  { key: 'ocio', nombre: 'Ocio consciente', esfera: 'base', icono: 'coffee', orden: 10, activa: true, topeDiarioMin: 180 },
];

