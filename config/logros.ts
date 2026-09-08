/**
 * Catálogo de logros. Los secretos se muestran como silueta bloqueada, sin
 * descripción, hasta que caen: contarlos de antemano los convierte en una
 * lista de tareas más.
 */

export type CondicionLogro =
  | { tipo: 'registros'; valor: number }
  | { tipo: 'rachaMaxima'; valor: number }
  | { tipo: 'nivelGlobal'; valor: number }
  | { tipo: 'nivelCategoria'; categoria: string; valor: number }
  /** Ese nivel en TODAS las categorías de la lista a la vez. */
  | { tipo: 'nivelEnVarias'; categorias: readonly string[]; valor: number }
  | { tipo: 'categoriasEnUnDia'; valor: number }
  | { tipo: 'nodosDesbloqueados'; valor: number }
  | { tipo: 'maestrias'; valor: number }
  | { tipo: 'misionesCompletadas'; valor: number }
  | { tipo: 'semanalesCompletadas'; valor: number }
  | { tipo: 'registrosDeOcio'; valor: number }
  | { tipo: 'registrosAntesDeLas7'; valor: number }
  | { tipo: 'registrosDespuesDeLas23'; valor: number };

export type DefLogro = {
  key: string;
  nombre: string;
  descripcion: string;
  esSecreto: boolean;
  condicion: CondicionLogro;
  orden: number;
};

export const LOGROS: DefLogro[] = [
  { key: 'primer-paso', nombre: 'Primer paso', descripcion: 'Registra tu primera actividad', esSecreto: false, condicion: { tipo: 'registros', valor: 1 }, orden: 1 },
  { key: 'constancia-10', nombre: 'Diez veces', descripcion: 'Registra diez actividades', esSecreto: false, condicion: { tipo: 'registros', valor: 10 }, orden: 2 },
  { key: 'constancia-100', nombre: 'Cien veces', descripcion: 'Registra cien actividades', esSecreto: false, condicion: { tipo: 'registros', valor: 100 }, orden: 3 },

  { key: 'racha-7', nombre: 'Una semana entera', descripcion: 'Siete días seguidos', esSecreto: false, condicion: { tipo: 'rachaMaxima', valor: 7 }, orden: 4 },
  { key: 'racha-30', nombre: 'Un mes sin fallar', descripcion: 'Treinta días seguidos', esSecreto: false, condicion: { tipo: 'rachaMaxima', valor: 30 }, orden: 5 },
  { key: 'racha-100', nombre: 'Cien días', descripcion: 'Cien días seguidos', esSecreto: false, condicion: { tipo: 'rachaMaxima', valor: 100 }, orden: 6 },

  { key: 'nivel-5', nombre: 'Nivel 5', descripcion: 'Alcanza el nivel global 5', esSecreto: false, condicion: { tipo: 'nivelGlobal', valor: 5 }, orden: 7 },
  { key: 'nivel-10', nombre: 'Nivel 10', descripcion: 'Alcanza el nivel global 10', esSecreto: false, condicion: { tipo: 'nivelGlobal', valor: 10 }, orden: 8 },
  { key: 'nivel-20', nombre: 'Nivel 20', descripcion: 'Alcanza el nivel global 20', esSecreto: false, condicion: { tipo: 'nivelGlobal', valor: 20 }, orden: 9 },

  { key: 'primer-nodo', nombre: 'Especializarse', descripcion: 'Desbloquea tu primer nodo del árbol', esSecreto: false, condicion: { tipo: 'nodosDesbloqueados', valor: 1 }, orden: 10 },
  { key: 'diez-nodos', nombre: 'Ramificado', descripcion: 'Desbloquea diez nodos', esSecreto: false, condicion: { tipo: 'nodosDesbloqueados', valor: 10 }, orden: 11 },
  { key: 'maestria', nombre: 'Se demuestra', descripcion: 'Verifica tu primer nodo de maestría', esSecreto: false, condicion: { tipo: 'maestrias', valor: 1 }, orden: 12 },

  { key: 'primera-mision', nombre: 'A la orden', descripcion: 'Completa tu primera misión', esSecreto: false, condicion: { tipo: 'misionesCompletadas', valor: 1 }, orden: 13 },
  { key: 'jefe', nombre: 'Jefe derrotado', descripcion: 'Completa una misión semanal', esSecreto: false, condicion: { tipo: 'semanalesCompletadas', valor: 1 }, orden: 14 },
  { key: 'cincuenta-misiones', nombre: 'Veterano', descripcion: 'Completa cincuenta misiones', esSecreto: false, condicion: { tipo: 'misionesCompletadas', valor: 50 }, orden: 15 },

  { key: 'descanso-cuenta', nombre: 'Descansar también cuenta', descripcion: 'Registra diez ratos de ocio consciente', esSecreto: false, condicion: { tipo: 'registrosDeOcio', valor: 10 }, orden: 16 },
  { key: 'equilibrio', nombre: 'Equilibrio', descripcion: 'Alcanza el nivel 5 en Ocio consciente', esSecreto: false, condicion: { tipo: 'nivelCategoria', categoria: 'ocio', valor: 5 }, orden: 17 },

  // ── Secretos: silueta sin descripción hasta que caen ──────────────────
  { key: 'polimata-dia', nombre: 'Hombre del Renacimiento', descripcion: 'Cuatro categorías distintas en un solo día', esSecreto: true, condicion: { tipo: 'categoriasEnUnDia', valor: 4 }, orden: 18 },
  { key: 'madrugador', nombre: 'Antes que el sol', descripcion: 'Diez registros antes de las siete de la mañana', esSecreto: true, condicion: { tipo: 'registrosAntesDeLas7', valor: 10 }, orden: 19 },
  { key: 'nocturno', nombre: 'Criatura de la noche', descripcion: 'Diez registros después de las once', esSecreto: true, condicion: { tipo: 'registrosDespuesDeLas23', valor: 10 }, orden: 20 },
  { key: 'atleta-erudito', nombre: 'Guerrero-monje', descripcion: 'Nivel 10 en Físico y en Mental a la vez', esSecreto: true, condicion: { tipo: 'nivelEnVarias', categorias: ['fisico', 'mental'], valor: 10 }, orden: 21 },
];

/** Títulos y cosméticos que pueden salir de un cofre. */
export const TITULOS_DE_COFRE = [
  'el Constante',
  'el Insomne',
  'Rompeolas',
  'el que Vuelve',
  'Sin Excusas',
  'el Paciente',
  'Cabeza Fría',
  'el Curioso',
];

export const COSMETICOS_DE_COFRE = [
  'Aura de brasa',
  'Contorno de nieve',
  'Marco dorado',
  'Silueta de tinta',
  'Halo turquesa',
  'Fondo de tormenta',
];
