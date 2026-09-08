import { describe, expect, it } from 'vitest';
import {
  calcularModificadores,
  multiplicadorRacha,
  multiplicadorRepeticion,
  type SituacionRegistro,
} from '@/lib/domain/modificadores';

function situacion(over: Partial<SituacionRegistro> = {}): SituacionRegistro {
  return {
    categoriaId: 'fisico',
    diasRacha: 0,
    esPrimeraVez: false,
    haySinergia: false,
    tieneEvidencia: false,
    esCategoriaDescuidada: false,
    ocurrenciaEnElDia: 0,
    ...over,
  };
}

describe('multiplicador de racha', () => {
  it('no bonifica por debajo de tres dias', () => {
    expect(multiplicadorRacha(0)).toBe(1);
    expect(multiplicadorRacha(2)).toBe(1);
  });

  it('sube por escalones hasta el tope de 1.5', () => {
    expect(multiplicadorRacha(3)).toBe(1.1);
    expect(multiplicadorRacha(6)).toBe(1.1);
    expect(multiplicadorRacha(7)).toBe(1.2);
    expect(multiplicadorRacha(14)).toBe(1.3);
    expect(multiplicadorRacha(30)).toBe(1.4);
    expect(multiplicadorRacha(60)).toBe(1.5);
    expect(multiplicadorRacha(1000)).toBe(1.5);
  });
});

describe('decaimiento por repeticion', () => {
  it('castiga la segunda y tercera sesion del mismo dia', () => {
    expect(multiplicadorRepeticion(0)).toBe(1);
    expect(multiplicadorRepeticion(1)).toBe(0.6);
    expect(multiplicadorRepeticion(2)).toBe(0.3);
    expect(multiplicadorRepeticion(9)).toBe(0.3);
  });
});

describe('calcularModificadores', () => {
  it('sin nada activo el producto es 1 y el detalle queda vacio', () => {
    const m = calcularModificadores(situacion());
    expect(m.detalle).toEqual({});
    expect(m.producto).toBe(1);
    expect(m.topeAplicado).toBe(false);
  });

  it('multiplica los factores activos y los deja auditables', () => {
    const m = calcularModificadores(
      situacion({ esPrimeraVez: true, tieneEvidencia: true }),
    );
    expect(m.detalle).toEqual({ primeraVez: 2, evidencia: 1.15 });
    expect(m.producto).toBe(2.3);
    expect(m.productoTopado).toBe(2.3);
  });

  it('aplica la pasiva de clase solo a la categoria que toca', () => {
    const clase = { dominante: 'mental', descuidada: 'fisico' };
    const m = calcularModificadores(situacion({ clase }));
    expect(m.detalle).toEqual({ claseDescuidada: 1.25 });
    expect(calcularModificadores(situacion({ categoriaId: 'mental', clase })).detalle)
      .toEqual({ claseDominante: 1.1 });
  });

  it('mete el premio del cofre como un modificador mas', () => {
    expect(calcularModificadores(situacion({ multiplicadorCofre: 1.3 })).detalle).toEqual({
      cofre: 1.3,
    });
    // Un cofre de x1 no ensucia el desglose con un factor que no hace nada.
    expect(calcularModificadores(situacion({ multiplicadorCofre: 1 })).detalle).toEqual({});
  });

  it('el cofre tampoco se salta el tope', () => {
    const m = calcularModificadores(
      situacion({ diasRacha: 60, esPrimeraVez: true, haySinergia: true, multiplicadorCofre: 1.5 }),
    );
    expect(m.productoTopado).toBe(4);
  });

  it('topa el producto en 4.0 en el peor caso legal', () => {
    const m = calcularModificadores(
      situacion({
        diasRacha: 60,
        esPrimeraVez: true,
        haySinergia: true,
        tieneEvidencia: true,
        esCategoriaDescuidada: true,
        clase: { dominante: null, descuidada: 'fisico' },
      }),
    );
    expect(m.producto).toBeCloseTo(6.47, 2);
    expect(m.productoTopado).toBe(4);
    expect(m.topeAplicado).toBe(true);
  });
});
