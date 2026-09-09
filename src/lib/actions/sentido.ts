'use server';

import { revalidatePath } from 'next/cache';
import { guardarRespuesta } from '@/lib/db/sentido';
import type { RespuestaChequeo } from '@/lib/domain/tipos';

export async function responderChequeo(categoriaKey: string, respuesta: RespuestaChequeo) {
  const resultado = await guardarRespuesta(categoriaKey, respuesta);
  if (resultado.ok) revalidatePath('/');
  return resultado;
}
