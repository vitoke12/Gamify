import { describe, expect, it } from 'vitest';
import { calcularClase, capitulos } from '@/lib/domain/clases';

const TODAS = [
  'fisico',
  'mental',
  'emocional',
  'social',
  'profesional',
  'creativo',
  'aventura',
  'habitos',
  'financiero',
  'ocio',
];

/** Los niveles se dan como "ganados + 1", que es como los guarda la app. */
function niveles(ganados: Record<string, number>): Record<string, number> {
  return Object.fromEntries(TODAS.map((c) => [c, (ganados[c] ?? 0) + 1]));
}

describe('sin esfuerzo no hay clase', () => {
  it('un perfil recien creado no tiene clase', () => {
    expect(calcularClase(niveles({}), TODAS)).toBeNull();
  });

  it('tampoco la tiene si todas siguen en nivel 1', () => {
    expect(calcularClase({}, TODAS)).toBeNull();
  });
});

describe('clases puras', () => {
  it('una categoria por encima del 35% define la clase', () => {
    const clase = calcularClase(niveles({ fisico: 10, mental: 5, habitos: 4 }), TODAS);
    expect(clase).toMatchObject({ key: 'atleta', tipo: 'pura', dominantes: ['fisico'] });
  });

  it('cada categoria tiene la suya', () => {
    expect(calcularClase(niveles({ mental: 10, fisico: 2 }), TODAS)?.key).toBe('erudito');
    expect(calcularClase(niveles({ habitos: 10, fisico: 2 }), TODAS)?.key).toBe('asceta');
    expect(calcularClase(niveles({ financiero: 10, fisico: 2 }), TODAS)?.key).toBe('mercader');
    expect(calcularClase(niveles({ ocio: 10, fisico: 2 }), TODAS)?.key).toBe('monje-relajado');
  });

  it('justo en el 35% todavia no basta', () => {
    // 7 de 20 = 35% exacto, y el umbral es estrictamente mayor.
    const clase = calcularClase(niveles({ fisico: 7, mental: 7, habitos: 6 }), TODAS);
    expect(clase?.tipo).not.toBe('pura');
  });
});

describe('clases hibridas', () => {
  it('dos que suman mas del 55% sin llegar ninguna al 35%', () => {
    // fisico 6/20 = 30%, mental 6/20 = 30%, suman 60%
    const clase = calcularClase(
      niveles({ fisico: 6, mental: 6, habitos: 4, social: 4 }),
      TODAS,
    );
    expect(clase).toMatchObject({ key: 'guerrero-monje', tipo: 'hibrida' });
    expect(clase?.dominantes.sort()).toEqual(['fisico', 'mental']);
  });

  it('reconoce las demas parejas con nombre', () => {
    expect(
      calcularClase(niveles({ social: 6, profesional: 6, fisico: 4, mental: 4 }), TODAS)?.key,
    ).toBe('lider');
    expect(
      calcularClase(niveles({ creativo: 6, mental: 6, fisico: 4, social: 4 }), TODAS)?.key,
    ).toBe('inventor');
    expect(
      calcularClase(niveles({ fisico: 6, aventura: 6, mental: 4, social: 4 }), TODAS)?.key,
    ).toBe('nomada');
  });

  it('una pareja sin nombre cae en polimata en vez de dejarte sin clase', () => {
    const clase = calcularClase(
      niveles({ fisico: 6, habitos: 6, mental: 4, social: 4 }),
      TODAS,
    );
    expect(clase?.key).toBe('polimata');
  });
});

describe('polimata', () => {
  it('esfuerzo repartido, ninguna por encima del 25%', () => {
    const clase = calcularClase(
      niveles({ fisico: 5, mental: 5, habitos: 5, social: 5, creativo: 5 }),
      TODAS,
    );
    expect(clase).toMatchObject({ key: 'polimata', tipo: 'polimata' });
  });

  it('tambien recoge el hueco entre concentrado y repartido', () => {
    // fisico 30%, sin pareja que llegue al 55%: ni pura ni hibrida.
    const clase = calcularClase(
      niveles({ fisico: 6, mental: 4, habitos: 4, social: 3, creativo: 3 }),
      TODAS,
    );
    expect(clase?.key).toBe('polimata');
  });
});

describe('pasiva y reparto', () => {
  it('empuja hacia la dominante y hacia la mas descuidada', () => {
    const clase = calcularClase(niveles({ fisico: 10, mental: 5, habitos: 1 }), TODAS);
    expect(clase?.pasiva.dominante).toBe('fisico');
    expect(clase?.pasiva.descuidada).not.toBe('fisico');
    expect(clase?.pasiva.descuidada).toBeTruthy();
  });

  it('el reparto suma 1', () => {
    const clase = calcularClase(niveles({ fisico: 3, mental: 2, ocio: 5 }), TODAS);
    const suma = Object.values(clase!.distribucion).reduce((a, b) => a + b, 0);
    expect(suma).toBeCloseTo(1, 6);
  });
});

describe('historial como capitulos', () => {
  it('ordena por mes y marca los cambios de clase', () => {
    const historia = capitulos([
      { mes: '2026-03', claseKey: 'erudito', tipo: 'pura', dominantes: ['mental'] },
      { mes: '2026-01', claseKey: 'erudito', tipo: 'pura', dominantes: ['mental'] },
      { mes: '2026-05', claseKey: 'nomada', tipo: 'hibrida', dominantes: ['fisico', 'aventura'] },
      { mes: '2026-02', claseKey: 'erudito', tipo: 'pura', dominantes: ['mental'] },
    ]);
    expect(historia.map((c) => c.mes)).toEqual(['2026-01', '2026-02', '2026-03', '2026-05']);
    expect(historia.map((c) => c.esCambio)).toEqual([true, false, false, true]);
    expect(historia[3].nombre).toBe('Nómada');
  });
});
