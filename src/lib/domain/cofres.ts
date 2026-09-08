/**
 * Cofres. La recompensa de la misión semanal tiene que ser impredecible en
 * TIPO y en MAGNITUD: un cofre que siempre da lo mismo, o que da lo mismo
 * dentro de un margen estrecho, deja de ser un cofre a la segunda semana.
 *
 * La semilla es la misión concreta, así que abrir el mismo cofre dos veces da
 * lo mismo (no se puede recargar hasta que salga algo mejor) pero cada cofre
 * es distinto del anterior.
 */
import { COSMETICOS_DE_COFRE, TITULOS_DE_COFRE } from '@config/logros';
import { crearAleatorio } from './rng';

export type Recompensa =
  | { tipo: 'xp'; xp: number }
  | { tipo: 'multiplicador'; multiplicador: number; dias: number }
  | { tipo: 'titulo'; titulo: string }
  | { tipo: 'cosmetico'; cosmetico: string };

/** Reparto de tipos. Suma 1. */
const PESOS: { tipo: Recompensa['tipo']; peso: number }[] = [
  { tipo: 'xp', peso: 0.35 },
  { tipo: 'multiplicador', peso: 0.25 },
  { tipo: 'titulo', peso: 0.2 },
  { tipo: 'cosmetico', peso: 0.2 },
];

export function abrirCofre(semilla: string): Recompensa {
  const rng = crearAleatorio(`cofre:${semilla}`);

  let tirada = rng.siguiente();
  let tipo: Recompensa['tipo'] = 'xp';
  for (const opcion of PESOS) {
    if (tirada < opcion.peso) {
      tipo = opcion.tipo;
      break;
    }
    tirada -= opcion.peso;
  }

  switch (tipo) {
    case 'xp':
      // Rango ancho a propósito: 120 y 900 son premios muy distintos.
      return { tipo: 'xp', xp: rng.entero(12, 91) * 10 };
    case 'multiplicador':
      return {
        tipo: 'multiplicador',
        multiplicador: 1 + rng.entero(1, 6) / 10,
        dias: rng.entero(1, 4),
      };
    case 'titulo':
      return { tipo: 'titulo', titulo: rng.elegir(TITULOS_DE_COFRE) };
    case 'cosmetico':
      return { tipo: 'cosmetico', cosmetico: rng.elegir(COSMETICOS_DE_COFRE) };
  }
}

export function describirRecompensa(recompensa: Recompensa): string {
  switch (recompensa.tipo) {
    case 'xp':
      return `${recompensa.xp.toLocaleString('es-ES')} XP de golpe`;
    case 'multiplicador':
      return `x${recompensa.multiplicador} de XP durante ${recompensa.dias} ${
        recompensa.dias === 1 ? 'día' : 'días'
      }`;
    case 'titulo':
      return `Título: ${recompensa.titulo}`;
    case 'cosmetico':
      return `Cosmético: ${recompensa.cosmetico}`;
  }
}
