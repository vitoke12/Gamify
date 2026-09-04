/**
 * Dificultad relativa: cuanto supera la actividad el nivel que ya tienes en
 * esa skill. Es la variable anti-estancamiento del motor.
 *
 * Repetir lo que ya dominas cae a 1.0; atacar algo cuatro tiers por encima de
 * tu nivel llega a 2.0. Una actividad sin nodo asociado (Ocio consciente, o
 * cualquier categoria todavia sin arbol) vale 1.0: descansar no es una
 * escalera de tiers y fingir que lo es seria mentir con numeros.
 */
import { ECONOMIA } from '@config/economia';
import type { Actividad } from './tipos';

export function dificultadRelativa(
  actividad: Actividad,
  nivelPorNodo: Record<string, number>,
): number {
  const { min, max, porTierDeBrecha } = ECONOMIA.dificultad;
  if (!actividad.nodoId) return min;

  // Un nodo sin desbloquear cuenta como nivel 1: la actividad se puede
  // registrar igual, solo que la brecha se mide desde el escalon mas bajo.
  const nivel = Math.max(1, nivelPorNodo[actividad.nodoId] ?? 0);
  const brecha = actividad.tierEquivalente - nivel;
  const valor = 1 + porTierDeBrecha * brecha;

  return redondear2(Math.min(max, Math.max(min, valor)));
}

export function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}
