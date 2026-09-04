'use server';

import { revalidatePath } from 'next/cache';
import { aplicarRegistro, type DatosRegistro, type ResultadoRegistro } from '@/lib/db/registro';

export type { DatosRegistro, ResultadoRegistro };

/** Envoltorio de Next sobre la escritura real, que vive en /lib/db/registro. */
export async function registrarActividad(datos: DatosRegistro): Promise<ResultadoRegistro> {
  const resultado = await aplicarRegistro(datos);

  if (resultado.ok) {
    revalidatePath('/');
    revalidatePath('/registrar');
  }

  return resultado;
}
