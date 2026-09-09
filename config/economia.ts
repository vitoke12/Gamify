/**
 * Economía del juego. Todo lo numérico vive aquí: ajustar el equilibrio no
 * debería requerir tocar ni una línea de lógica ni de UI.
 *
 * `version` se guarda en cada ActivityLog (`versionFormula`). Si cambias
 * cualquier número de este archivo, súbela: permite distinguir logs
 * calculados con reglas distintas y recalcularlos con conocimiento de causa.
 */
export const ECONOMIA = {
  version: 2,

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

  /**
   * Ritmo de una actividad: cuánta XP vale cada minuto suyo.
   *
   * No todas las categorías tienen forma de duración. Físico, Mental u Ocio
   * se miden en ratos: te sientas una hora. Social, Emocional o Financiero se
   * miden en actos: una conversación difícil dura quince minutos y cuesta más
   * que una hora de cinta; una transferencia a la cartera dura dos y pesa más
   * que los dos minutos que ocupa.
   *
   * Pagar todo a 3 XP por minuto no era neutral: hacía que las categorías
   * largas ganaran siempre, no por mérito sino por cómo se miden. El ritmo
   * corrige eso sin tocar la fórmula.
   */
  ritmos: {
    /** Cosas que ocupan mucho rato y cuestan poco por minuto. */
    ligero: 1.5,
    /** El caso normal: entrenar, leer, estudiar, cocinar. */
    normal: 3,
    /** Rato corto y caro: hablar en público, una conversación difícil. */
    denso: 6,
  },

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

    /**
     * Sinergia: escala con cuántas categorías distintas tocas el mismo día
     * lógico. Con diez categorías vivas, pagar igual por tocar dos que por
     * tocar cinco dejaba la amplitud sin recompensa a partir de la segunda.
     */
    escalaSinergia: [
      { categorias: 2, mult: 1.2 },
      { categorias: 3, mult: 1.3 },
      { categorias: 4, mult: 1.4 },
    ],

    /** Foto, captura o dato de wearable adjunto. */
    evidencia: 1.15,

    /**
     * Equilibrio: empuje graduado hacia lo que llevas flojo.
     *
     * Antes solo lo cobraba LA categoría más descuidada. Con diez vivas, eso
     * significaba que nueve no recibían ningún empuje y la única que lo
     * recibía cambiaba de dueña cada semana. Ahora lo cobra todo lo que esté
     * por debajo de la mitad de la media, y tanto más cuanto más atrás vaya:
     * a media o más, nada; a cero, el máximo.
     */
    equilibrio: { umbralCuota: 0.5, maximo: 1.25 },

    /** 1ª, 2ª y 3ª+ sesión de la misma actividad el mismo día. */
    decaimientoRepeticion: [1.0, 0.6, 0.3],

    /** Pasiva de clase (fase 4): dominante y más descuidada. */
    claseDominante: 1.1,
    claseDescuidada: 1.25,
  },

  /** Puntos de habilidad otorgados por cada nivel de categoría ganado. */
  puntosPorNivel: 1,

  nodos: {
    /**
     * Los puntos compran el DESBLOQUEO de un nodo; su nivel sube con la
     * práctica, con la XP registrada en él. Tiene que ser así: la dificultad
     * relativa baja al subir de nivel en la skill, de modo que si el nivel se
     * comprase, estarías pagando puntos para ganar menos XP.
     *
     * Escalón triangular: el nivel n pide xpPorNivel · (n-1) · n / 2 de XP
     * acumulada en ese nodo. Con 2.500: nivel 2 a las 2.500, nivel 3 a las
     * 7.500, nivel 4 a las 15.000 y nivel 5 a las 25.000.
     */
    xpPorNivel: 2500,
  },

  /** Días que deben pasar entre dos respec de la misma categoría. */
  diasEntreRespec: 90,

  /** Congeladores de racha por mes natural. */
  congeladoresPorMes: 2,
} as const;

export type ClaveIntensidad = keyof typeof ECONOMIA.intensidades;
