/**
 * Chequeo de sentido.
 *
 * Cada 30 días la app pregunta, por cada categoría que estés trabajando:
 * "¿notas este progreso fuera de la app?". Si una categoría acumula noes, lo
 * dice sin adornos y sugiere revisar si lo que registras mide lo que de
 * verdad importa.
 *
 * Esta función es deliberadamente antagónica al enganche. Una app que sube
 * números sin que la vida cambie es un bucle de dopamina vacío, y la única
 * defensa contra eso es preguntarlo en voz alta y aceptar la respuesta.
 */
import { diferenciaDias } from './dia';
import type { RespuestaChequeo } from './tipos';

/** Días de práctica antes de tener derecho a preguntar. */
export const DIAS_ANTES_DE_PREGUNTAR = 30;

export type CategoriaChequeable = {
  key: string;
  /** Primer día lógico con actividad en esa categoría. */
  primerDia: string | null;
  /** Si se ha registrado algo en ella durante el periodo en curso. */
  activaEnElPeriodo: boolean;
};

/**
 * A qué categorías toca preguntar. Solo las que llevas trabajando un mes o
 * más: preguntar por algo que empezaste anteayer no informa de nada.
 */
export function categoriasAPreguntar(
  categorias: readonly CategoriaChequeable[],
  yaRespondidas: ReadonlySet<string>,
  hoy: string,
): string[] {
  return categorias
    .filter((c) => c.activaEnElPeriodo)
    .filter((c) => !yaRespondidas.has(c.key))
    .filter((c) => c.primerDia !== null && diferenciaDias(c.primerDia, hoy) >= DIAS_ANTES_DE_PREGUNTAR)
    .map((c) => c.key);
}

export type RespuestaSentido = {
  categoria: string;
  periodo: string;
  respuesta: RespuestaChequeo;
};

export type Alerta = {
  categoria: string;
  negativas: number;
  total: number;
  mensaje: string;
};

/**
 * Categorías donde el progreso no se está notando fuera. Hacen falta dos
 * respuestas para señalar: un "no" suelto puede ser un mes malo.
 */
export function alertasDeSentido(respuestas: readonly RespuestaSentido[]): Alerta[] {
  const porCategoria = new Map<string, RespuestaSentido[]>();
  for (const r of respuestas) {
    const lista = porCategoria.get(r.categoria) ?? [];
    lista.push(r);
    porCategoria.set(r.categoria, lista);
  }

  const alertas: Alerta[] = [];
  for (const [categoria, lista] of porCategoria) {
    const ordenadas = [...lista].sort((a, b) => a.periodo.localeCompare(b.periodo));
    const ultimas = ordenadas.slice(-3);
    const negativas = ultimas.filter((r) => r.respuesta === 'no').length;
    if (negativas >= 2) {
      alertas.push({
        categoria,
        negativas,
        total: ultimas.length,
        mensaje:
          'Llevas meses subiendo números aquí sin notarlo fuera. Puede que las actividades que registras no midan lo que de verdad te importa de esta categoría.',
      });
    }
  }
  return alertas;
}
