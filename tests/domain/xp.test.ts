import { describe, expect, it } from 'vitest';
import { recalcularDia, xpPorCategoria, xpTotal } from '@/lib/domain/xp';
import type { Actividad, ContextoCalculo, EntradaRegistro } from '@/lib/domain/tipos';

function actividad(id: string, over: Partial<Actividad> = {}): Actividad {
  return {
    id,
    key: id,
    categoriaId: 'fisico',
    nodoId: null,
    nombre: id,
    unidad: 'minutos',
    minutosPorUnidad: 1,
    xpBasePorMinuto: 3,
    tierEquivalente: 1,
    ...over,
  };
}

function contexto(acts: Actividad[], over: Partial<ContextoCalculo> = {}): ContextoCalculo {
  return {
    actividades: Object.fromEntries(acts.map((a) => [a.id, a])),
    topeDiarioPorCategoria: {},
    nivelPorNodo: {},
    // Por defecto todas las actividades ya se han hecho antes: asi los tests
    // que no van del bonus de novedad no lo arrastran sin querer.
    actividadesYaVistas: new Set(acts.map((a) => a.id)),
    diasRachaPorCategoria: {},
    cuotaRelativaPorCategoria: {},
    horaCorteDia: 5,
    ...over,
  };
}

function entrada(
  id: string,
  actividadId: string,
  hora: number,
  cantidad: number,
  over: Partial<EntradaRegistro> = {},
): EntradaRegistro {
  return {
    id,
    actividadId,
    fecha: new Date(2026, 8, 4, hora, 0),
    cantidad,
    intensidad: 1,
    tieneEvidencia: false,
    ...over,
  };
}

describe('formula base', () => {
  it('multiplica xp por minuto, duracion e intensidad', () => {
    const a = actividad('correr');
    const logs = recalcularDia([entrada('l1', 'correr', 9, 60)], contexto([a]));
    expect(logs[0].xpBase).toBe(180);
    expect(logs[0].xpCalculado).toBe(180);
    expect(logs[0].diaLogico).toBe('2026-09-04');
  });

  it('aplica la intensidad declarada por el usuario', () => {
    const a = actividad('correr');
    const suave = recalcularDia(
      [entrada('l1', 'correr', 9, 60, { intensidad: 0.8 })],
      contexto([a]),
    );
    const exigente = recalcularDia(
      [entrada('l1', 'correr', 9, 60, { intensidad: 1.5 })],
      contexto([a]),
    );
    expect(suave[0].xpCalculado).toBe(144);
    expect(exigente[0].xpCalculado).toBe(270);
  });

  it('convierte unidades que no son minutos', () => {
    const a = actividad('leer', { categoriaId: 'mental', unidad: 'paginas', minutosPorUnidad: 1.5 });
    const logs = recalcularDia([entrada('l1', 'leer', 9, 40)], contexto([a]));
    expect(logs[0].duracionBrutaMin).toBe(60);
    expect(logs[0].xpCalculado).toBe(180);
  });

  it('escala la XP con la dificultad relativa del nodo', () => {
    const a = actividad('kite', { nodoId: 'kite-navegacion', tierEquivalente: 3 });
    const logs = recalcularDia(
      [entrada('l1', 'kite', 9, 60)],
      contexto([a], { nivelPorNodo: { 'kite-navegacion': 1 } }),
    );
    expect(logs[0].dificultadRelativa).toBe(1.5);
    expect(logs[0].xpCalculado).toBe(270);
  });
});

describe('tope diario por categoria', () => {
  it('deja de puntuar los minutos que exceden el tope', () => {
    const acts = [actividad('gym'), actividad('correr')];
    const logs = recalcularDia(
      [entrada('l1', 'gym', 9, 120), entrada('l2', 'correr', 18, 120)],
      contexto(acts, { topeDiarioPorCategoria: { fisico: 180 } }),
    );
    expect(logs[0].duracionMin).toBe(120);
    expect(logs[1].duracionBrutaMin).toBe(120);
    expect(logs[1].duracionMin).toBe(60);
    expect(xpTotal(logs)).toBe(540); // 180 min computables x 3 XP
  });

  it('guarda el log aunque el tope ya este agotado, con 0 XP', () => {
    const acts = [actividad('gym'), actividad('correr'), actividad('nadar')];
    const logs = recalcularDia(
      [
        entrada('l1', 'gym', 9, 180),
        entrada('l2', 'correr', 18, 30),
        entrada('l3', 'nadar', 20, 30),
      ],
      contexto(acts, { topeDiarioPorCategoria: { fisico: 180 } }),
    );
    expect(logs[2].duracionMin).toBe(0);
    expect(logs[2].xpCalculado).toBe(0);
    expect(logs).toHaveLength(3);
  });

  it('cuenta el tope por categoria, no en global', () => {
    const acts = [actividad('gym'), actividad('leer', { categoriaId: 'mental' })];
    const logs = recalcularDia(
      [entrada('l1', 'gym', 9, 180), entrada('l2', 'leer', 18, 60)],
      contexto(acts, { topeDiarioPorCategoria: { fisico: 180, mental: 180 } }),
    );
    expect(logs[1].duracionMin).toBe(60);
    // Hay dos categorias en el dia, asi que ambas cobran la sinergia x1,2:
    // 180 min x 3 x 1,2 = 648 y 60 min x 3 x 1,2 = 216.
    expect(xpPorCategoria(logs)).toEqual({ fisico: 648, mental: 216 });
  });
});

describe('sinergia', () => {
  it('es retroactiva: alcanza tambien al log de la manana', () => {
    // Registras Fisico a las 9:00 y Mental a las 20:00. El de las 9:00
    // tambien cumple "dos categorias el mismo dia" y debe cobrarlo.
    const acts = [actividad('gym'), actividad('leer', { categoriaId: 'mental' })];
    const logs = recalcularDia(
      [entrada('l1', 'gym', 9, 30), entrada('l2', 'leer', 20, 30)],
      contexto(acts),
    );
    expect(logs[0].modificadores.sinergia).toBe(1.2);
    expect(logs[1].modificadores.sinergia).toBe(1.2);
    expect(logs[0].xpCalculado).toBe(108);
  });

  it('no se activa con una sola categoria en el dia', () => {
    const acts = [actividad('gym'), actividad('correr')];
    const logs = recalcularDia(
      [entrada('l1', 'gym', 9, 30), entrada('l2', 'correr', 20, 30)],
      contexto(acts),
    );
    expect(logs[0].modificadores.sinergia).toBeUndefined();
  });
});

describe('novedad y repeticion', () => {
  it('dobla la XP la primera vez que se registra una actividad', () => {
    const a = actividad('kite');
    const logs = recalcularDia(
      [entrada('l1', 'kite', 9, 30)],
      contexto([a], { actividadesYaVistas: new Set() }),
    );
    expect(logs[0].modificadores.primeraVez).toBe(2);
    expect(logs[0].xpCalculado).toBe(180);
  });

  it('el bonus de novedad no se repite dentro del mismo dia', () => {
    const a = actividad('kite');
    const logs = recalcularDia(
      [entrada('l1', 'kite', 9, 30), entrada('l2', 'kite', 18, 30)],
      contexto([a], { actividadesYaVistas: new Set() }),
    );
    expect(logs[0].modificadores.primeraVez).toBe(2);
    expect(logs[1].modificadores.primeraVez).toBeUndefined();
    expect(logs[1].modificadores.repeticion).toBe(0.6);
    expect(logs[1].xpCalculado).toBe(54);
  });

  it('hunde la tercera sesion de la misma actividad', () => {
    const a = actividad('gym');
    const logs = recalcularDia(
      [
        entrada('l1', 'gym', 9, 30),
        entrada('l2', 'gym', 14, 30),
        entrada('l3', 'gym', 20, 30),
      ],
      contexto([a]),
    );
    expect(logs.map((l) => l.xpCalculado)).toEqual([90, 54, 27]);
  });
});

describe('tope al producto de modificadores', () => {
  it('recorta el apilamiento extremo a x4', () => {
    const acts = [actividad('kite'), actividad('leer', { categoriaId: 'mental' })];
    const logs = recalcularDia(
      [entrada('l1', 'kite', 9, 30, { tieneEvidencia: true }), entrada('l2', 'leer', 20, 10)],
      contexto(acts, {
        actividadesYaVistas: new Set(),
        diasRachaPorCategoria: { fisico: 60 },
        cuotaRelativaPorCategoria: { fisico: 0 },
        clase: { dominante: null, descuidada: 'fisico' },
      }),
    );
    expect(logs[0].productoModificadores).toBe(4);
    expect(logs[0].xpCalculado).toBe(360); // 3 x 30 x 4, sin x19,4
  });
});

describe('multiplicador de cofre', () => {
  it('se aplica a los registros mientras dura', () => {
    const a = actividad('gym');
    const logs = recalcularDia(
      [entrada('l1', 'gym', 9, 60)],
      contexto([a], { multiplicadorCofre: 1.5 }),
    );
    expect(logs[0].modificadores.cofre).toBe(1.5);
    expect(logs[0].xpCalculado).toBe(270); // 180 x 1,5
  });
});

describe('reproducibilidad', () => {
  it('el resultado no depende del orden en que lleguen las entradas', () => {
    const acts = [actividad('gym'), actividad('leer', { categoriaId: 'mental' })];
    const entradas = [
      entrada('l1', 'gym', 9, 60),
      entrada('l2', 'leer', 14, 30),
      entrada('l3', 'gym', 20, 60),
    ];
    const enOrden = recalcularDia(entradas, contexto(acts));
    const alReves = recalcularDia([...entradas].reverse(), contexto(acts));
    expect(alReves).toEqual(enOrden);
  });

  it('recalcular dos veces el mismo dia da lo mismo', () => {
    const acts = [actividad('gym')];
    const entradas = [entrada('l1', 'gym', 9, 45)];
    expect(recalcularDia(entradas, contexto(acts))).toEqual(
      recalcularDia(entradas, contexto(acts)),
    );
  });

  it('avisa si el contexto no trae la actividad', () => {
    expect(() => recalcularDia([entrada('l1', 'fantasma', 9, 30)], contexto([]))).toThrow(
      /Actividad desconocida/,
    );
  });
});
