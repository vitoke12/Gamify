'use server';

import { revalidatePath } from 'next/cache';
import {
  aplicarDesbloqueo,
  aplicarRespec,
  aplicarVerificacionMaestria,
  type ResultadoArbol,
} from '@/lib/db/desbloqueos';

export type { ResultadoArbol };

function refrescar() {
  revalidatePath('/');
  revalidatePath('/arbol', 'layout');
}

export async function desbloquearNodo(nodoId: string): Promise<ResultadoArbol> {
  const resultado = await aplicarDesbloqueo(nodoId);
  if (resultado.ok) refrescar();
  return resultado;
}

export async function verificarMaestria(
  nodoId: string,
  evidencia: string,
): Promise<ResultadoArbol> {
  const resultado = await aplicarVerificacionMaestria(nodoId, evidencia);
  if (resultado.ok) refrescar();
  return resultado;
}

export async function respecCategoria(categoriaKey: string): Promise<ResultadoArbol> {
  const resultado = await aplicarRespec(categoriaKey);
  if (resultado.ok) refrescar();
  return resultado;
}
