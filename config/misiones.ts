/**
 * Pool de misiones. Son datos: añadir una misión nueva es añadir una línea
 * aquí, sin tocar el generador ni la UI.
 *
 * Las misiones se completan SOLAS, mirando los registros del día. No hay un
 * botón de "completar": si el registro tiene que costar menos de 15 segundos,
 * apuntar dos veces lo mismo sobra, y un botón de completar a mano es una
 * invitación a mentirse.
 */

export type ObjetivoDef =
  | { tipo: 'minutosCategoria'; categoria: string; minutos: number }
  | { tipo: 'minutosActividad'; actividad: string; minutos: number }
  | { tipo: 'sesionesActividad'; actividad: string; sesiones: number }
  | { tipo: 'sesionesCategoria'; categoria: string; sesiones: number }
  | { tipo: 'categoriasDistintas'; categorias: number }
  | { tipo: 'minutosTotales'; minutos: number };

export type TipoMisionDef = 'principal' | 'secundaria' | 'ocio' | 'sorpresa' | 'semanal';

export type DefMision = {
  key: string;
  tipo: TipoMisionDef;
  /** Categoría a la que se atribuye la XP de la recompensa. */
  categoria: string;
  descripcion: string;
  objetivo: ObjetivoDef;
  xp: number;
};

export const XP_MISION = {
  principal: 150,
  secundaria: 40,
  ocio: 30,
  sorpresa: 60,
  semanal: 400,
} as const;

export const MISIONES: DefMision[] = [
  // ── Principales: una sola al día, obligatoria ─────────────────────────
  { key: 'p-fisico-sesion', tipo: 'principal', categoria: 'fisico', descripcion: 'Entrena 45 minutos, del tipo que sea', objetivo: { tipo: 'minutosCategoria', categoria: 'fisico', minutos: 45 }, xp: XP_MISION.principal },
  { key: 'p-fisico-doble', tipo: 'principal', categoria: 'fisico', descripcion: 'Dos sesiones físicas hoy, aunque sean cortas', objetivo: { tipo: 'sesionesCategoria', categoria: 'fisico', sesiones: 2 }, xp: XP_MISION.principal },
  { key: 'p-fisico-largo', tipo: 'principal', categoria: 'fisico', descripcion: 'Una sesión larga: 90 minutos de físico', objetivo: { tipo: 'minutosCategoria', categoria: 'fisico', minutos: 90 }, xp: XP_MISION.principal },

  { key: 'p-mental-foco', tipo: 'principal', categoria: 'mental', descripcion: 'Un bloque de foco profundo de 60 minutos', objetivo: { tipo: 'minutosActividad', actividad: 'act-foco', minutos: 60 }, xp: XP_MISION.principal },
  { key: 'p-mental-lectura', tipo: 'principal', categoria: 'mental', descripcion: 'Lee 40 páginas hoy', objetivo: { tipo: 'minutosActividad', actividad: 'act-leer', minutos: 60 }, xp: XP_MISION.principal },
  { key: 'p-mental-sesion', tipo: 'principal', categoria: 'mental', descripcion: '45 minutos de trabajo mental, en lo que elijas', objetivo: { tipo: 'minutosCategoria', categoria: 'mental', minutos: 45 }, xp: XP_MISION.principal },

  { key: 'p-habitos-manana', tipo: 'principal', categoria: 'habitos', descripcion: 'Planifica el día y cumple otro hábito más', objetivo: { tipo: 'sesionesCategoria', categoria: 'habitos', sesiones: 2 }, xp: XP_MISION.principal },
  { key: 'p-habitos-cocina', tipo: 'principal', categoria: 'habitos', descripcion: 'Cocina en casa hoy, 40 minutos', objetivo: { tipo: 'minutosActividad', actividad: 'act-cocinar', minutos: 40 }, xp: XP_MISION.principal },
  { key: 'p-habitos-sesion', tipo: 'principal', categoria: 'habitos', descripcion: '30 minutos dedicados a tus hábitos', objetivo: { tipo: 'minutosCategoria', categoria: 'habitos', minutos: 30 }, xp: XP_MISION.principal },

  { key: 'p-ocio-largo', tipo: 'principal', categoria: 'ocio', descripcion: 'Una hora de descanso deliberado, sin culpa', objetivo: { tipo: 'minutosCategoria', categoria: 'ocio', minutos: 60 }, xp: XP_MISION.principal },

  // ── Secundarias: se ofrecen tres y eliges dos ─────────────────────────
  { key: 's-fisico-corto', tipo: 'secundaria', categoria: 'fisico', descripcion: '20 minutos de movimiento', objetivo: { tipo: 'minutosCategoria', categoria: 'fisico', minutos: 20 }, xp: XP_MISION.secundaria },
  { key: 's-fisico-movilidad', tipo: 'secundaria', categoria: 'fisico', descripcion: '10 minutos de movilidad', objetivo: { tipo: 'minutosActividad', actividad: 'act-movilidad', minutos: 10 }, xp: XP_MISION.secundaria },
  { key: 's-fisico-correr', tipo: 'secundaria', categoria: 'fisico', descripcion: 'Sal a correr, aunque sea poco', objetivo: { tipo: 'sesionesActividad', actividad: 'act-correr', sesiones: 1 }, xp: XP_MISION.secundaria },

  { key: 's-mental-lectura', tipo: 'secundaria', categoria: 'mental', descripcion: 'Lee 15 páginas', objetivo: { tipo: 'minutosActividad', actividad: 'act-leer', minutos: 22 }, xp: XP_MISION.secundaria },
  { key: 's-mental-notas', tipo: 'secundaria', categoria: 'mental', descripcion: 'Resume por escrito algo que hayas aprendido', objetivo: { tipo: 'sesionesActividad', actividad: 'act-notas', sesiones: 1 }, xp: XP_MISION.secundaria },
  { key: 's-mental-repaso', tipo: 'secundaria', categoria: 'mental', descripcion: '15 minutos de repaso espaciado', objetivo: { tipo: 'minutosActividad', actividad: 'act-repaso', minutos: 15 }, xp: XP_MISION.secundaria },

  { key: 's-habitos-meditar', tipo: 'secundaria', categoria: 'habitos', descripcion: 'Medita 10 minutos', objetivo: { tipo: 'minutosActividad', actividad: 'act-meditar', minutos: 10 }, xp: XP_MISION.secundaria },
  { key: 's-habitos-planificar', tipo: 'secundaria', categoria: 'habitos', descripcion: 'Decide por la mañana qué importa hoy', objetivo: { tipo: 'sesionesActividad', actividad: 'act-planificar', sesiones: 1 }, xp: XP_MISION.secundaria },
  { key: 's-habitos-sueno', tipo: 'secundaria', categoria: 'habitos', descripcion: 'Acuéstate a la hora que te habías propuesto', objetivo: { tipo: 'sesionesActividad', actividad: 'act-dormir-bien', sesiones: 1 }, xp: XP_MISION.secundaria },

  { key: 's-ocio-naturaleza', tipo: 'secundaria', categoria: 'ocio', descripcion: 'Sal a la naturaleza 20 minutos', objetivo: { tipo: 'minutosActividad', actividad: 'act-ocio-naturaleza', minutos: 20 }, xp: XP_MISION.secundaria },
  { key: 's-ocio-gente', tipo: 'secundaria', categoria: 'ocio', descripcion: 'Un rato con gente que quieres', objetivo: { tipo: 'sesionesActividad', actividad: 'act-ocio-social', sesiones: 1 }, xp: XP_MISION.secundaria },

  // ── Ocio consciente: una al día, sin condiciones ──────────────────────
  { key: 'o-sin-pantalla', tipo: 'ocio', categoria: 'ocio', descripcion: '30 minutos sin pantallas, sin hacer nada útil', objetivo: { tipo: 'minutosActividad', actividad: 'act-ocio-sin-pantalla', minutos: 30 }, xp: XP_MISION.ocio },
  { key: 'o-aficion', tipo: 'ocio', categoria: 'ocio', descripcion: 'Dedica un rato a una afición sin objetivo', objetivo: { tipo: 'sesionesActividad', actividad: 'act-ocio-juego', sesiones: 1 }, xp: XP_MISION.ocio },
  { key: 'o-cualquiera', tipo: 'ocio', categoria: 'ocio', descripcion: 'Descansa 20 minutos a conciencia', objetivo: { tipo: 'minutosCategoria', categoria: 'ocio', minutos: 20 }, xp: XP_MISION.ocio },
  { key: 'o-naturaleza', tipo: 'ocio', categoria: 'ocio', descripcion: 'Un paseo sin prisa', objetivo: { tipo: 'sesionesActividad', actividad: 'act-ocio-naturaleza', sesiones: 1 }, xp: XP_MISION.ocio },

  // ── Sorpresa: no sale todos los días, y su premio no se ve hasta el final ──
  { key: 'x-cualquiera', tipo: 'sorpresa', categoria: 'ocio', descripcion: 'Registra 20 minutos de lo que quieras', objetivo: { tipo: 'minutosTotales', minutos: 20 }, xp: XP_MISION.sorpresa },
  { key: 'x-dos-frentes', tipo: 'sorpresa', categoria: 'mental', descripcion: 'Toca dos categorías distintas hoy', objetivo: { tipo: 'categoriasDistintas', categorias: 2 }, xp: XP_MISION.sorpresa },
  { key: 'x-madrugon', tipo: 'sorpresa', categoria: 'habitos', descripcion: 'Un hábito y algo de físico en el mismo día', objetivo: { tipo: 'categoriasDistintas', categorias: 2 }, xp: XP_MISION.sorpresa },

  // ── Semanal tipo jefe: combina 3 categorías o más ─────────────────────
  { key: 'w-tres-frentes', tipo: 'semanal', categoria: 'fisico', descripcion: 'Toca tres categorías distintas esta semana', objetivo: { tipo: 'categoriasDistintas', categorias: 3 }, xp: XP_MISION.semanal },
  { key: 'w-cuatro-frentes', tipo: 'semanal', categoria: 'mental', descripcion: 'Las cuatro categorías vivas en una sola semana', objetivo: { tipo: 'categoriasDistintas', categorias: 4 }, xp: XP_MISION.semanal },
  { key: 'w-volumen', tipo: 'semanal', categoria: 'fisico', descripcion: 'Ocho horas registradas en la semana, repartidas', objetivo: { tipo: 'minutosTotales', minutos: 480 }, xp: XP_MISION.semanal },
];

/** Veces que una misma plantilla puede repetirse dentro de una semana. */
export const MAX_REPETICIONES_POR_SEMANA = 2;

/** Probabilidad de que aparezca la misión sorpresa. No es diaria a propósito. */
export const PROBABILIDAD_SORPRESA = 0.3;
