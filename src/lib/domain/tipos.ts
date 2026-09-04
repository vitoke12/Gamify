/**
 * Tipos del dominio. Nada de esto depende de Prisma ni de React: son las
 * uniones que SQLite no puede expresar como enum y las formas planas que
 * consumen las funciones puras.
 */

export type ClaveEsfera = 'interior' | 'expresion' | 'base';
export type Unidad = 'minutos' | 'repeticiones' | 'paginas';
export type ClaveIntensidad = 'suave' | 'normal' | 'exigente';
export type OrigenXp = 'actividad' | 'mision' | 'cofre' | 'logro' | 'ajuste';
export type TipoMision = 'principal' | 'secundaria' | 'sorpresa' | 'ocio' | 'semanal';
export type EstadoMision = 'ofrecida' | 'aceptada' | 'completada' | 'caducada';
export type TipoRecompensa = 'titulo' | 'cosmetico' | 'multiplicador' | 'xp';
export type TipoClase = 'pura' | 'hibrida' | 'polimata';
export type RespuestaChequeo = 'si' | 'algo' | 'no';
export type EstadoNodo = 'dominado' | 'en-progreso' | 'disponible' | 'bloqueado';

/** Actividad tal y como la necesita el motor de XP. */
export type Actividad = {
  id: string;
  key: string;
  categoriaId: string;
  nodoId: string | null;
  nombre: string;
  unidad: Unidad;
  minutosPorUnidad: number;
  xpBasePorMinuto: number;
  tierEquivalente: number;
};

/** Lo que el usuario declara al registrar. Es la entrada inmutable. */
export type EntradaRegistro = {
  id: string;
  actividadId: string;
  fecha: Date;
  /** En la unidad de la actividad. */
  cantidad: number;
  intensidad: number;
  tieneEvidencia: boolean;
};

/**
 * Estado del perfil en el momento de calcular. Se pasa explicitamente para
 * que el calculo sea una funcion pura y reproducible.
 */
export type ContextoCalculo = {
  actividades: Record<string, Actividad>;
  /** Tope de minutos computables por categoria y dia. */
  topeDiarioPorCategoria: Record<string, number>;
  /** nodoId -> nivel actual del usuario (0 = no desbloqueado). */
  nivelPorNodo: Record<string, number>;
  /** Actividades con al menos un log en dias ANTERIORES a este. */
  actividadesYaVistas: ReadonlySet<string>;
  /** Dias de racha por categoria al comenzar el dia. */
  diasRachaPorCategoria: Record<string, number>;
  /** Categoria con menor nivel relativo del perfil. */
  categoriaDescuidada: string | null;
  /** Pasiva de clase (fase 4). Ausente = sin clase todavia. */
  clase?: { dominante: string | null; descuidada: string | null };
  horaCorteDia: number;
};

/** Resultado del motor: lo que se persiste como ActivityLog. */
export type LogCalculado = {
  id: string;
  actividadId: string;
  categoriaId: string;
  fecha: Date;
  diaLogico: string;
  cantidad: number;
  duracionBrutaMin: number;
  duracionMin: number;
  intensidad: number;
  dificultadRelativa: number;
  modificadores: Record<string, number>;
  productoModificadores: number;
  xpBase: number;
  xpCalculado: number;
  versionFormula: number;
};
