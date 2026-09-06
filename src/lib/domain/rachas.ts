/**
 * Rachas y congeladores.
 *
 * La racha sigue viva si el ultimo dia con actividad es hoy o ayer: no se
 * rompe por no haber registrado todavia lo de hoy. Castigar a alguien a las
 * nueve de la manana por un dia que aun no ha terminado es la forma mas
 * rapida de que desinstale la app.
 *
 * Los congeladores existen por lo mismo: sin ellos un dia malo destruye meses
 * de constancia. Son dos al mes, se gastan solos y solo cuando de verdad
 * salvan la cadena; si el hueco es mas grande que el cupo no se malgastan.
 */
import { ECONOMIA } from '@config/economia';
import { diferenciaDias, mesDe, sumarDias } from './dia';

export type Racha = {
  diasActuales: number;
  diasMaximos: number;
  ultimoDia: string | null;
  /** true si hay que registrar hoy para no perderla. */
  enRiesgo: boolean;
};

export function calcularRacha(
  diasConActividad: readonly string[],
  hoy: string,
  diasPerdonados: readonly string[] = [],
): Racha {
  const dias = [...new Set([...diasConActividad, ...diasPerdonados])].sort();
  if (dias.length === 0) {
    return { diasActuales: 0, diasMaximos: 0, ultimoDia: null, enRiesgo: false };
  }

  let mejor = 1;
  let corriendo = 1;
  for (let i = 1; i < dias.length; i++) {
    corriendo = diferenciaDias(dias[i - 1], dias[i]) === 1 ? corriendo + 1 : 1;
    if (corriendo > mejor) mejor = corriendo;
  }

  const ultimoDia = dias[dias.length - 1];
  const distancia = diferenciaDias(ultimoDia, hoy);
  const viva = distancia === 0 || distancia === 1;

  return {
    diasActuales: viva ? corriendo : 0,
    diasMaximos: mejor,
    ultimoDia,
    enRiesgo: viva && distancia === 1,
  };
}

export type EstadoCongeladores = {
  restantes: number;
  /** Mes natural al que pertenece el cupo vigente, "2026-09". */
  mesDelCupo: string;
};

export type ResultadoRacha = {
  racha: Racha;
  /** Dias perdonados en esta pasada. Son los que hay que registrar y avisar. */
  nuevosPerdonados: string[];
  congeladores: EstadoCongeladores;
  cupoRenovado: boolean;
};

/**
 * Pone la racha al dia: renueva el cupo mensual si toca y gasta congeladores
 * por los dias que falten entre el ultimo registro y ayer.
 *
 * Nunca perdona el dia de hoy: hoy todavia se puede registrar.
 */
export function avanzarRacha(
  diasConActividad: readonly string[],
  perdonadosPrevios: readonly string[],
  hoy: string,
  congeladores: EstadoCongeladores,
): ResultadoRacha {
  const cupoRenovado = mesDe(hoy) !== congeladores.mesDelCupo;
  const estado: EstadoCongeladores = cupoRenovado
    ? { restantes: ECONOMIA.congeladoresPorMes, mesDelCupo: mesDe(hoy) }
    : { ...congeladores };

  const dias = [...new Set([...diasConActividad, ...perdonadosPrevios])].sort();
  if (dias.length === 0) {
    return {
      racha: calcularRacha(diasConActividad, hoy, perdonadosPrevios),
      nuevosPerdonados: [],
      congeladores: estado,
      cupoRenovado,
    };
  }

  const ultimo = dias[dias.length - 1];
  const huecos = diferenciaDias(ultimo, hoy) - 1;

  const nuevosPerdonados: string[] = [];
  // Solo se gastan si alcanzan para tapar el hueco entero. Quemar el ultimo
  // congelador en una ausencia de una semana no salva nada.
  if (huecos > 0 && huecos <= estado.restantes) {
    for (let i = 1; i <= huecos; i++) nuevosPerdonados.push(sumarDias(ultimo, i));
    estado.restantes -= huecos;
  }

  return {
    racha: calcularRacha(diasConActividad, hoy, [...perdonadosPrevios, ...nuevosPerdonados]),
    nuevosPerdonados,
    congeladores: estado,
    cupoRenovado,
  };
}
