/**
 * Misiones: generación del tablero y evaluación del progreso.
 *
 * La generación es determinista, sembrada con la fecha. No hace falta un cron
 * a las 05:00: la primera vez que se abre la app después del corte, el
 * tablero sale igual que habría salido a esa hora, y sale idéntico si se
 * vuelve a pedir. Un servidor que se apaga por la noche no se pierde nada.
 *
 * Las misiones se completan solas mirando los registros del día. No hay botón
 * de "completar": apuntar dos veces lo mismo rompe la regla de los 15
 * segundos, y un botón manual es una invitación a mentirse.
 */
import {
  MAX_REPETICIONES_POR_SEMANA,
  PROBABILIDAD_SORPRESA,
  type DefMision,
  type ObjetivoDef,
  type TipoMisionDef,
} from '@config/misiones';
import { crearAleatorio } from './rng';

/** Efecto oculto de la misión sorpresa. No se revela hasta completarla. */
export type EfectoSorpresa = 'doble-xp' | 'bonus-fijo' | 'logro-secreto';

export const EFECTOS_SORPRESA: EfectoSorpresa[] = ['doble-xp', 'bonus-fijo', 'logro-secreto'];

export type MisionGenerada = {
  plantillaKey: string;
  tipo: TipoMisionDef;
  categoria: string;
  descripcion: string;
  objetivo: ObjetivoDef;
  xp: number;
  /** Las secundarias nacen "ofrecida": hay que elegir dos de las tres. */
  estado: 'ofrecida' | 'aceptada';
  efecto?: EfectoSorpresa;
};

export type OpcionesTablero = {
  dia: string;
  pool: readonly DefMision[];
  /** Categoría con racha activa o la más trabajada. Manda en la principal. */
  categoriaPrincipal: string | null;
  categoriasDisponibles: readonly string[];
  /** Veces que se ha usado cada plantilla en la semana en curso. */
  usosEstaSemana: Record<string, number>;
};

function disponibles(
  pool: readonly DefMision[],
  tipo: TipoMisionDef,
  opciones: OpcionesTablero,
): DefMision[] {
  return pool.filter(
    (m) =>
      m.tipo === tipo &&
      opciones.categoriasDisponibles.includes(m.categoria) &&
      (opciones.usosEstaSemana[m.key] ?? 0) < MAX_REPETICIONES_POR_SEMANA,
  );
}

/**
 * Tablero del día: una principal, tres secundarias de categorías distintas
 * para elegir dos, una de ocio y, con suerte, una sorpresa.
 */
export function generarTableroDelDia(opciones: OpcionesTablero): MisionGenerada[] {
  const rng = crearAleatorio(`misiones:${opciones.dia}`);
  const salida: MisionGenerada[] = [];

  const comoGenerada = (
    m: DefMision,
    estado: 'ofrecida' | 'aceptada',
    efecto?: EfectoSorpresa,
  ): MisionGenerada => ({
    plantillaKey: m.key,
    tipo: m.tipo,
    categoria: m.categoria,
    descripcion: m.descripcion,
    objetivo: m.objetivo,
    xp: m.xp,
    estado,
    ...(efecto ? { efecto } : {}),
  });

  // Principal: de la categoría con racha activa o la más trabajada.
  const principales = disponibles(opciones.pool, 'principal', opciones);
  const preferidas = opciones.categoriaPrincipal
    ? principales.filter((m) => m.categoria === opciones.categoriaPrincipal)
    : [];
  const candidatasPrincipal = preferidas.length > 0 ? preferidas : principales;
  if (candidatasPrincipal.length > 0) {
    salida.push(comoGenerada(rng.elegir(rng.barajar(candidatasPrincipal)), 'aceptada'));
  }
  const categoriaPrincipalElegida = salida[0]?.categoria;

  // Tres secundarias de categorías distintas entre sí. La elección importa:
  // la autonomía sostiene la motivación mucho mejor que la imposición.
  const secundarias = rng.barajar(disponibles(opciones.pool, 'secundaria', opciones));
  const usadas = new Set<string>();
  const elegidas: DefMision[] = [];
  for (const pasada of [0, 1]) {
    for (const m of secundarias) {
      if (elegidas.length >= 3) break;
      if (elegidas.some((e) => e.key === m.key)) continue;
      if (usadas.has(m.categoria)) continue;
      // En la primera pasada se evita repetir la categoría de la principal.
      if (pasada === 0 && m.categoria === categoriaPrincipalElegida) continue;
      elegidas.push(m);
      usadas.add(m.categoria);
    }
    if (elegidas.length >= 3) break;
    usadas.clear();
    for (const e of elegidas) usadas.add(e.categoria);
  }
  for (const m of elegidas) salida.push(comoGenerada(m, 'ofrecida'));

  // Ocio consciente: sin condiciones. Da XP como el resto.
  const ocio = disponibles(opciones.pool, 'ocio', opciones);
  if (ocio.length > 0) salida.push(comoGenerada(rng.elegir(rng.barajar(ocio)), 'aceptada'));

  // Sorpresa: su valor está en que NO aparece siempre.
  if (rng.oportunidad(PROBABILIDAD_SORPRESA)) {
    const sorpresas = disponibles(opciones.pool, 'sorpresa', opciones);
    if (sorpresas.length > 0) {
      salida.push(
        comoGenerada(rng.elegir(rng.barajar(sorpresas)), 'aceptada', rng.elegir(EFECTOS_SORPRESA)),
      );
    }
  }

  return salida;
}

/** Misión semanal tipo jefe: una por semana, combina tres categorías o más. */
export function generarMisionSemanal(opciones: {
  semana: string;
  pool: readonly DefMision[];
  categoriasDisponibles: readonly string[];
}): MisionGenerada | null {
  const rng = crearAleatorio(`semanal:${opciones.semana}`);
  const candidatas = opciones.pool.filter(
    (m) => m.tipo === 'semanal' && opciones.categoriasDisponibles.includes(m.categoria),
  );
  if (candidatas.length === 0) return null;
  const elegida = rng.elegir(rng.barajar(candidatas));
  return {
    plantillaKey: elegida.key,
    tipo: 'semanal',
    categoria: elegida.categoria,
    descripcion: elegida.descripcion,
    objetivo: elegida.objetivo,
    xp: elegida.xp,
    estado: 'aceptada',
  };
}

/**
 * Registro reducido a lo que necesita un objetivo. Se usan los minutos
 * BRUTOS: el tope diario recorta la XP, no lo que de verdad hiciste, y una
 * misión que dice "entrena 45 minutos" se cumple entrenando 45 minutos.
 */
export type RegistroParaObjetivo = {
  categoria: string;
  actividad: string;
  minutos: number;
};

export type ProgresoObjetivo = { actual: number; meta: number; hecho: boolean };

export function progresoObjetivo(
  objetivo: ObjetivoDef,
  registros: readonly RegistroParaObjetivo[],
): ProgresoObjetivo {
  const sumar = (filtro: (r: RegistroParaObjetivo) => boolean) =>
    registros.filter(filtro).reduce((total, r) => total + r.minutos, 0);
  const contar = (filtro: (r: RegistroParaObjetivo) => boolean) => registros.filter(filtro).length;

  let actual: number;
  let meta: number;

  switch (objetivo.tipo) {
    case 'minutosCategoria':
      actual = sumar((r) => r.categoria === objetivo.categoria);
      meta = objetivo.minutos;
      break;
    case 'minutosActividad':
      actual = sumar((r) => r.actividad === objetivo.actividad);
      meta = objetivo.minutos;
      break;
    case 'sesionesActividad':
      actual = contar((r) => r.actividad === objetivo.actividad);
      meta = objetivo.sesiones;
      break;
    case 'sesionesCategoria':
      actual = contar((r) => r.categoria === objetivo.categoria);
      meta = objetivo.sesiones;
      break;
    case 'categoriasDistintas':
      actual = new Set(registros.map((r) => r.categoria)).size;
      meta = objetivo.categorias;
      break;
    case 'minutosTotales':
      actual = sumar(() => true);
      meta = objetivo.minutos;
      break;
  }

  return { actual: Math.round(actual), meta, hecho: actual >= meta };
}

/** Texto corto del avance, para la tarjeta de la misión. */
export function textoProgreso(objetivo: ObjetivoDef, progreso: ProgresoObjetivo): string {
  const unidad =
    objetivo.tipo === 'sesionesActividad' || objetivo.tipo === 'sesionesCategoria'
      ? 'sesiones'
      : objetivo.tipo === 'categoriasDistintas'
        ? 'categorías'
        : 'min';
  return `${Math.min(progreso.actual, progreso.meta)} / ${progreso.meta} ${unidad}`;
}
