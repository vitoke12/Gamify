/**
 * Actividades registrables. Cuelgan SIEMPRE de una categoría; el nodo es
 * opcional, porque hay categorías con XP y sin árbol (Ocio consciente) y
 * porque el registro no puede depender de haber desbloqueado nada.
 *
 * `tierEquivalente` es lo que entra en el cálculo de dificultad relativa:
 * se compara con el nivel que el usuario tiene en el nodo asociado.
 */

export type Unidad = 'minutos' | 'repeticiones' | 'paginas';

export type DefActividad = {
  key: string;
  categoria: string;
  nodo?: string;
  nombre: string;
  unidad: Unidad;
  /** Minutos que representa una unidad. Para 'minutos' siempre es 1. */
  minutosPorUnidad: number;
  xpBasePorMinuto?: number;
  tierEquivalente: number;
  orden: number;
};

export const ACTIVIDADES: DefActividad[] = [
  // ── Físico ────────────────────────────────────────────────────────────
  { key: 'act-kite-sesion', categoria: 'fisico', nodo: 'kite-navegacion', nombre: 'Kite: navegar (sin saltos)', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 3, orden: 1 },
  // Los tiers 4 existen en el árbol, así que necesitan actividad propia: si
  // no, al dominar Navegación la dificultad relativa se quedaría clavada en
  // 1,0 sin ningún escalón al que saltar.
  { key: 'act-kite-freestyle', categoria: 'fisico', nodo: 'kite-freestyle', nombre: 'Kite: saltos y trucos nuevos', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 4, orden: 2 },
  { key: 'act-kite-olas', categoria: 'fisico', nodo: 'kite-olas', nombre: 'Kite: olas o spot nuevo', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 4, orden: 3 },
  { key: 'act-kite-teoria', categoria: 'fisico', nodo: 'kite-seguridad', nombre: 'Teoría de kite (viento, seguridad)', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 4 },
  { key: 'act-gimnasio', categoria: 'fisico', nodo: 'fue-progresion', nombre: 'Gimnasio', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 3 },
  { key: 'act-calistenia', categoria: 'fisico', nodo: 'fue-calistenia', nombre: 'Calistenia', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 4 },
  { key: 'act-correr', categoria: 'fisico', nodo: 'res-base-aerobica', nombre: 'Correr', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 5 },
  { key: 'act-series', categoria: 'fisico', nodo: 'res-umbral', nombre: 'Series / intervalos', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 6 },
  { key: 'act-movilidad', categoria: 'fisico', nodo: 'mov-rutina', nombre: 'Movilidad', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 7 },

  // ── Mental ────────────────────────────────────────────────────────────
  // Una página se contabiliza como 1,5 minutos de trabajo mental.
  { key: 'act-leer', categoria: 'mental', nodo: 'con-lectura', nombre: 'Leer', unidad: 'paginas', minutosPorUnidad: 1.5, tierEquivalente: 1, orden: 1 },
  { key: 'act-estudiar', categoria: 'mental', nodo: 'con-estudio', nombre: 'Estudiar', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 2 },
  { key: 'act-notas', categoria: 'mental', nodo: 'con-notas', nombre: 'Escribir notas / resumir', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 3 },
  { key: 'act-foco', categoria: 'mental', nodo: 'foc-bloques', nombre: 'Bloque de foco profundo', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 4 },
  { key: 'act-repaso', categoria: 'mental', nodo: 'pen-memoria', nombre: 'Repaso espaciado', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 5 },
  { key: 'act-escritura', categoria: 'mental', nodo: 'pen-escritura', nombre: 'Escritura razonada', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 6 },

  // ── Hábitos ───────────────────────────────────────────────────────────
  { key: 'act-dormir-bien', categoria: 'habitos', nodo: 'sue-horario', nombre: 'Dormir a la hora prevista', unidad: 'minutos', minutosPorUnidad: 1, xpBasePorMinuto: 1, tierEquivalente: 1, orden: 1 },
  { key: 'act-cocinar', categoria: 'habitos', nodo: 'ali-cocina', nombre: 'Cocinar en casa', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 2 },
  { key: 'act-meditar', categoria: 'habitos', nodo: 'min-respiracion', nombre: 'Meditar', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 3 },
  { key: 'act-planificar', categoria: 'habitos', nodo: 'dis-planificacion', nombre: 'Planificar el día', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 4 },
  { key: 'act-revision-semanal', categoria: 'habitos', nodo: 'dis-revision', nombre: 'Revisión semanal', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 2, orden: 5 },

  // ── Ocio consciente ───────────────────────────────────────────────────
  // Sin nodo: la dificultad relativa se queda en 1.0 y está bien que así sea.
  // Descansar no es una escalera de tiers.
  { key: 'act-ocio-sin-pantalla', categoria: 'ocio', nombre: 'Descanso sin pantallas', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 1 },
  { key: 'act-ocio-social', categoria: 'ocio', nombre: 'Tiempo con gente que quieres', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 2 },
  { key: 'act-ocio-juego', categoria: 'ocio', nombre: 'Juego o afición sin objetivo', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 3 },
  { key: 'act-ocio-naturaleza', categoria: 'ocio', nombre: 'Salir a la naturaleza', unidad: 'minutos', minutosPorUnidad: 1, tierEquivalente: 1, orden: 4 },
];
