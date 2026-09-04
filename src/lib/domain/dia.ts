/**
 * El dia logico empieza a las 05:00 locales, no a medianoche.
 *
 * No es un capricho: las misiones se generan a las 5:00, asi que la racha, el
 * tope diario por categoria y el decaimiento por repeticion tienen que usar
 * ese mismo corte. Si no, una sesion de las 02:00 cuenta en el dia equivocado
 * y rompe la racha de quien entrena de noche.
 *
 * Todo se calcula en hora LOCAL: la app corre en la maquina del usuario.
 */

const MS_DIA = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Dia logico de un instante, como "2026-09-04". */
export function diaLogico(fecha: Date, horaCorte = 5): string {
  const d = new Date(fecha.getTime());
  d.setHours(d.getHours() - horaCorte);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Instante en que empieza ese dia logico. */
export function inicioDiaLogico(dia: string, horaCorte = 5): Date {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d, horaCorte, 0, 0, 0);
}

/** Suma (o resta) dias a una clave de dia logico. */
export function sumarDias(dia: string, n: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d) + n * MS_DIA);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Dias naturales entre dos dias logicos: positivo si el segundo es posterior. */
export function diferenciaDias(a: string, b: string): number {
  const [aa, am, ad] = a.split('-').map(Number);
  const [ba, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(ba, bm - 1, bd) - Date.UTC(aa, am - 1, ad)) / MS_DIA);
}

export function esDiaConsecutivo(anterior: string, siguiente: string): boolean {
  return diferenciaDias(anterior, siguiente) === 1;
}

/** Mes natural de un dia logico, como "2026-09". Cupo de congeladores. */
export function mesDe(dia: string): string {
  return dia.slice(0, 7);
}

/** Semana ISO de un dia logico, como "2026-W36". */
export function semanaIso(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  // El jueves de la misma semana define a que anio ISO pertenece.
  const diaSemana = (t.getUTCDay() + 6) % 7; // lunes = 0
  t.setUTCDate(t.getUTCDate() - diaSemana + 3);
  const anioIso = t.getUTCFullYear();
  const primerJueves = new Date(Date.UTC(anioIso, 0, 4));
  const offsetPrimero = (primerJueves.getUTCDay() + 6) % 7;
  primerJueves.setUTCDate(primerJueves.getUTCDate() - offsetPrimero + 3);
  const semana = 1 + Math.round((t.getTime() - primerJueves.getTime()) / (7 * MS_DIA));
  return `${anioIso}-W${pad(semana)}`;
}

/** Lunes (dia logico) de la semana a la que pertenece el dia dado. */
export function lunesDe(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  const t = new Date(Date.UTC(a, m - 1, d));
  const diaSemana = (t.getUTCDay() + 6) % 7;
  return sumarDias(dia, -diaSemana);
}

export function hoyLogico(horaCorte = 5, ahora: Date = new Date()): string {
  return diaLogico(ahora, horaCorte);
}
