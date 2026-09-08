/**
 * Modificadores de XP. Se multiplican entre si, pero el PRODUCTO esta topado.
 *
 * Sin ese tope el caso legal (primera vez x racha x sinergia x evidencia x
 * categoria descuidada x pasiva de clase) da x6,5 y, con intensidad y
 * dificultad encima, x19,4: una sola sesion de una hora daria 3.500 XP y
 * saltaria ocho niveles el primer dia. Intensidad y dificultad quedan fuera
 * del tope porque son declaraciones sobre la sesion, no premios.
 */
import { ECONOMIA } from '@config/economia';
import { redondear2 } from './dificultad';

const M = ECONOMIA.modificadores;

/** Escalon de racha alcanzado por dias consecutivos. Menos de 3 dias no bonifica. */
export function multiplicadorRacha(diasConsecutivos: number): number {
  let mult = 1;
  for (const escalon of M.escalaRacha) {
    if (diasConsecutivos >= escalon.dias) mult = escalon.mult;
  }
  return mult;
}

/** Decaimiento por repetir la misma actividad el mismo dia (indice 0 = 1a vez). */
export function multiplicadorRepeticion(ocurrenciaEnElDia: number): number {
  const tabla = M.decaimientoRepeticion;
  return tabla[Math.min(ocurrenciaEnElDia, tabla.length - 1)];
}

export type SituacionRegistro = {
  categoriaId: string;
  diasRacha: number;
  /** Primera vez que se registra esta actividad, nunca antes. */
  esPrimeraVez: boolean;
  /** Otra categoria distinta registrada el mismo dia logico. */
  haySinergia: boolean;
  tieneEvidencia: boolean;
  esCategoriaDescuidada: boolean;
  /** 0 = primera sesion de esa actividad hoy, 1 = segunda, etc. */
  ocurrenciaEnElDia: number;
  clase?: { dominante: string | null; descuidada: string | null };
  /** Multiplicador temporal de un cofre, si hay uno vigente. */
  multiplicadorCofre?: number;
};

export type Modificadores = {
  /** Cada factor por separado: se guarda en el log para poder auditarlo. */
  detalle: Record<string, number>;
  /** Producto sin topar, para poder explicar en la UI que se recorto. */
  producto: number;
  /** Lo que realmente entra en la formula. */
  productoTopado: number;
  topeAplicado: boolean;
};

export function calcularModificadores(s: SituacionRegistro): Modificadores {
  const detalle: Record<string, number> = {};

  const racha = multiplicadorRacha(s.diasRacha);
  if (racha !== 1) detalle.racha = racha;

  if (s.esPrimeraVez) detalle.primeraVez = M.primeraVez;
  if (s.haySinergia) detalle.sinergia = M.sinergia;
  if (s.tieneEvidencia) detalle.evidencia = M.evidencia;

  // La regla base de "categoria descuidada" y la pasiva de clase sobre la mas
  // descuidada son el MISMO disparador. Multiplicarlas daria x1,56 por una
  // sola razon, asi que se aplica una vez, con el valor mayor de las dos.
  const esDescuidada = s.esCategoriaDescuidada || s.clase?.descuidada === s.categoriaId;
  if (esDescuidada) {
    detalle.categoriaDescuidada = Math.max(M.categoriaDescuidada, M.claseDescuidada);
  }

  const repeticion = multiplicadorRepeticion(s.ocurrenciaEnElDia);
  if (repeticion !== 1) detalle.repeticion = repeticion;

  if (s.clase?.dominante === s.categoriaId) detalle.claseDominante = M.claseDominante;

  // El premio del cofre entra como un modificador mas, y por tanto tambien
  // se lo come el tope: un cofre afortunado no puede romper la economia.
  if (s.multiplicadorCofre && s.multiplicadorCofre > 1) {
    detalle.cofre = s.multiplicadorCofre;
  }

  const producto = Object.values(detalle).reduce((acc, v) => acc * v, 1);
  const productoTopado = Math.min(producto, M.topeProducto);

  return {
    detalle,
    producto: redondear2(producto),
    productoTopado: redondear2(productoTopado),
    topeAplicado: producto > M.topeProducto,
  };
}
