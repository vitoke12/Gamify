/**
 * Economía del juego. Todo lo numérico vive aquí: ajustar el equilibrio no
 * debería requerir tocar ni una línea de lógica ni de UI.
 *
 * `version` se guarda en cada ActivityLog (`versionFormula`). Si cambias
 * cualquier número de este archivo, súbela: permite distinguir logs
 * calculados con reglas distintas y recalcularlos con conocimiento de causa.
 */
export const ECONOMIA = {
  version: 1,

  /**
   * Curva de niveles: coste en XP de pasar del nivel n al n+1.
   *   xpParaSubirDeNivel(n) = round(base * n^exponente)
   * Con base 80 y exponente 1.8: nivel 1 -> 2 cuesta 80 XP, nivel 15 -> 16
   * cuesta 10.486 XP, y alcanzar el nivel 15 acumula ~50.900 XP.
   */
  curva: { base: 80, exponente: 1.8 },

  /** Hora local a la que empieza el día lógico. Las misiones se generan aquí. */
  horaCorteDia: 5,

  xpBasePorMinutoPorDefecto: 3,

  /** Tope de minutos computables por categoría y día lógico. */
  topeDiarioMinPorDefecto: 180,

  /** Declarada por el usuario al terminar la sesión. */
  intensidades: { suave: 0.8, normal: 1.0, exigente: 1.5 },

  /**
   * Dificultad relativa: cuánto supera la actividad el nivel actual en esa
   * skill. Es la variable anti-estancamiento.
   *   dificultad = clamp(1 + porTierDeBrecha * (tierActividad - nivelEnNodo), min, max)
   * Una actividad sin nodo asociado (Ocio, categorías sin ramas) vale `min`.
   */
  dificultad: { min: 1.0, max: 2.0, porTierDeBrecha: 0.25 },

  modificadores: {
    /**
     * Tope al PRODUCTO de los modificadores. Sin él, el caso legal
     * 2.0 x 1.5 x 1.2 x 1.15 x 1.25 x 1.25 da x6,5 y, con intensidad y
     * dificultad encima, x19,4: una sesión rompería la economía entera.
     * Intensidad y dificultad quedan fuera de este tope.
     */
    topeProducto: 4.0,

    /** Racha activa: escalón alcanzado por días consecutivos. */
    escalaRacha: [
      { dias: 3, mult: 1.1 },
      { dias: 7, mult: 1.2 },
      { dias: 14, mult: 1.3 },
      { dias: 30, mult: 1.4 },
      { dias: 60, mult: 1.5 },
    ],

    /** Primera vez que se registra esa actividad. Bonus de novedad. */
    primeraVez: 2.0,

    /** Dos categorías distintas registradas el mismo día lógico. */
    sinergia: 1.2,

    /** Foto, captura o dato de wearable adjunto. */
    evidencia: 1.15,

    /** La categoría con menor nivel relativo del perfil. */
    categoriaDescuidada: 1.25,

    /** 1ª, 2ª y 3ª+ sesión de la misma actividad el mismo día. */
    decaimientoRepeticion: [1.0, 0.6, 0.3],

    /** Pasiva de clase (fase 4): dominante y más descuidada. */
    claseDominante: 1.1,
    claseDescuidada: 1.25,
  },

  /** Puntos de habilidad otorgados por cada nivel de categoría ganado. */
  puntosPorNivel: 1,

  /** Días que deben pasar entre dos respec de la misma categoría. */
  diasEntreRespec: 90,

  /** Congeladores de racha por mes natural. */
  congeladoresPorMes: 2,
} as const;

export type ClaveIntensidad = keyof typeof ECONOMIA.intensidades;
