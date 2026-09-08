'use server';

import { revalidatePath } from 'next/cache';
import { alternarSecundaria } from '@/lib/db/misiones';
import { abrirPremio } from '@/lib/db/recompensas';

/** Eliges dos de las tres secundarias; volver a tocar una la suelta. */
export async function elegirSecundaria(questId: string) {
  const resultado = await alternarSecundaria(questId);
  if (resultado.ok) revalidatePath('/');
  return resultado;
}

export async function abrirCofrePendiente(rewardId: string) {
  const resultado = await abrirPremio(rewardId);
  if (resultado.ok) {
    revalidatePath('/');
    revalidatePath('/logros');
  }
  return resultado;
}
