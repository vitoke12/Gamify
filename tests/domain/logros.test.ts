import { describe, expect, it } from 'vitest';
import { LOGROS } from '@config/logros';
import {
  cumple,
  logrosCumplidos,
  logrosNuevos,
  ESTADO_VACIO,
  type EstadoParaLogros,
} from '@/lib/domain/logros';

function estado(over: Partial<EstadoParaLogros> = {}): EstadoParaLogros {
  return { ...ESTADO_VACIO, ...over };
}

describe('condiciones', () => {
  it('cuenta registros, rachas y niveles', () => {
    expect(cumple({ tipo: 'registros', valor: 10 }, estado({ registros: 10 }))).toBe(true);
    expect(cumple({ tipo: 'registros', valor: 10 }, estado({ registros: 9 }))).toBe(false);
    expect(cumple({ tipo: 'rachaMaxima', valor: 7 }, estado({ rachaMaxima: 30 }))).toBe(true);
    expect(cumple({ tipo: 'nivelGlobal', valor: 5 }, estado({ nivelGlobal: 5 }))).toBe(true);
  });

  it('mira el nivel de una categoría concreta', () => {
    const e = estado({ nivelPorCategoria: { ocio: 5, fisico: 2 } });
    expect(cumple({ tipo: 'nivelCategoria', categoria: 'ocio', valor: 5 }, e)).toBe(true);
    expect(cumple({ tipo: 'nivelCategoria', categoria: 'fisico', valor: 5 }, e)).toBe(false);
    expect(cumple({ tipo: 'nivelCategoria', categoria: 'mental', valor: 2 }, e)).toBe(false);
  });

  it('exige el nivel en todas las categorías de la lista a la vez', () => {
    const condicion = { tipo: 'nivelEnVarias', categorias: ['fisico', 'mental'], valor: 10 } as const;
    expect(cumple(condicion, estado({ nivelPorCategoria: { fisico: 10, mental: 10 } }))).toBe(true);
    expect(cumple(condicion, estado({ nivelPorCategoria: { fisico: 12, mental: 9 } }))).toBe(false);
  });

  it('cubre el resto de contadores', () => {
    expect(cumple({ tipo: 'categoriasEnUnDia', valor: 4 }, estado({ maxCategoriasEnUnDia: 4 }))).toBe(true);
    expect(cumple({ tipo: 'nodosDesbloqueados', valor: 1 }, estado({ nodosDesbloqueados: 3 }))).toBe(true);
    expect(cumple({ tipo: 'maestrias', valor: 1 }, estado({ maestrias: 0 }))).toBe(false);
    expect(cumple({ tipo: 'semanalesCompletadas', valor: 1 }, estado({ semanalesCompletadas: 2 }))).toBe(true);
    expect(cumple({ tipo: 'registrosDeOcio', valor: 10 }, estado({ registrosDeOcio: 11 }))).toBe(true);
    expect(cumple({ tipo: 'registrosAntesDeLas7', valor: 10 }, estado({ registrosAntesDeLas7: 4 }))).toBe(false);
    expect(cumple({ tipo: 'registrosDespuesDeLas23', valor: 10 }, estado({ registrosDespuesDeLas23: 10 }))).toBe(true);
  });
});

describe('catálogo', () => {
  it('un perfil recién creado no tiene ningún logro', () => {
    expect(logrosCumplidos(LOGROS, ESTADO_VACIO)).toEqual([]);
  });

  it('el primer registro desbloquea el primer paso', () => {
    expect(logrosCumplidos(LOGROS, estado({ registros: 1 }))).toEqual(['primer-paso']);
  });

  it('solo devuelve como nuevos los que no se tenían', () => {
    const e = estado({ registros: 10 });
    expect(logrosCumplidos(LOGROS, e)).toEqual(['primer-paso', 'constancia-10']);
    expect(logrosNuevos(LOGROS, e, new Set(['primer-paso']))).toEqual(['constancia-10']);
    expect(logrosNuevos(LOGROS, e, new Set(['primer-paso', 'constancia-10']))).toEqual([]);
  });

  it('tiene secretos, y todos con descripción para cuando caigan', () => {
    const secretos = LOGROS.filter((l) => l.esSecreto);
    expect(secretos.length).toBeGreaterThan(2);
    expect(secretos.every((l) => l.descripcion.length > 0)).toBe(true);
  });

  it('no tiene keys repetidas', () => {
    expect(new Set(LOGROS.map((l) => l.key)).size).toBe(LOGROS.length);
  });
});
