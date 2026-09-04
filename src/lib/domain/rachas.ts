/**
 * Rachas. Version de fase 1: se derivan de los dias con actividad.
 * Los congeladores (fase 2) se aplicaran encima, como dias perdonados.
 *
 * Regla clave: la racha sigue viva si el ultimo dia con actividad es hoy o
 * ayer. No se rompe por no haber registrado todavia lo de hoy; castigar a
 * alguien a las 9 de la manana por un dia que aun no ha terminado es la forma
 * mas rapida de que desinstale la app.
 */
import { diferenciaDias } from './dia';

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
