import { describe, expect, it } from 'vitest';
import { dificultadRelativa } from '@/lib/domain/dificultad';
import type { Actividad } from '@/lib/domain/tipos';

function act(tier: number, nodoId: string | null): Actividad {
  return {
    id: 'a1',
    key: 'a1',
    categoriaId: 'fisico',
    nodoId,
    nombre: 'Test',
    unidad: 'minutos',
    minutosPorUnidad: 1,
    xpBasePorMinuto: 3,
    tierEquivalente: tier,
  };
}

describe('dificultad relativa', () => {
  it('vale 1.0 cuando la actividad no cuelga de ningun nodo', () => {
    expect(dificultadRelativa(act(4, null), {})).toBe(1);
  });

  it('crece 0.25 por cada tier que la actividad supera tu nivel', () => {
    expect(dificultadRelativa(act(2, 'n1'), { n1: 1 })).toBe(1.25);
    expect(dificultadRelativa(act(3, 'n1'), { n1: 1 })).toBe(1.5);
    expect(dificultadRelativa(act(4, 'n1'), { n1: 1 })).toBe(1.75);
  });

  it('llega al tope de 2.0 y no lo pasa', () => {
    expect(dificultadRelativa(act(5, 'n1'), { n1: 1 })).toBe(2);
    expect(dificultadRelativa(act(9, 'n1'), { n1: 1 })).toBe(2);
  });

  it('repetir lo que ya dominas no da bonus: cae al minimo', () => {
    expect(dificultadRelativa(act(1, 'n1'), { n1: 3 })).toBe(1);
    expect(dificultadRelativa(act(2, 'n1'), { n1: 5 })).toBe(1);
  });

  it('un nodo sin desbloquear cuenta como nivel 1', () => {
    expect(dificultadRelativa(act(3, 'n1'), {})).toBe(1.5);
    expect(dificultadRelativa(act(3, 'n1'), { n1: 0 })).toBe(1.5);
  });
});
