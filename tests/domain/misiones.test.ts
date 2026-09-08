import { describe, expect, it } from 'vitest';
import { MISIONES } from '@config/misiones';
import {
  generarMisionSemanal,
  generarTableroDelDia,
  progresoObjetivo,
  textoProgreso,
  type OpcionesTablero,
  type RegistroParaObjetivo,
} from '@/lib/domain/misiones';

const CATEGORIAS = ['fisico', 'mental', 'habitos', 'ocio'];

function opciones(over: Partial<OpcionesTablero> = {}): OpcionesTablero {
  return {
    dia: '2026-09-06',
    pool: MISIONES,
    categoriaPrincipal: null,
    categoriasDisponibles: CATEGORIAS,
    usosEstaSemana: {},
    ...over,
  };
}

describe('generación del tablero', () => {
  it('es determinista: el mismo día da el mismo tablero', () => {
    expect(generarTableroDelDia(opciones())).toEqual(generarTableroDelDia(opciones()));
  });

  it('cambia de un día a otro', () => {
    const tableros = ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09'].map((dia) =>
      JSON.stringify(generarTableroDelDia(opciones({ dia }))),
    );
    expect(new Set(tableros).size).toBeGreaterThan(1);
  });

  it('trae una principal obligatoria, tres secundarias y una de ocio', () => {
    const tablero = generarTableroDelDia(opciones());
    expect(tablero.filter((m) => m.tipo === 'principal')).toHaveLength(1);
    expect(tablero.filter((m) => m.tipo === 'secundaria')).toHaveLength(3);
    expect(tablero.filter((m) => m.tipo === 'ocio')).toHaveLength(1);
  });

  it('las secundarias se ofrecen para elegir; el resto vienen dadas', () => {
    const tablero = generarTableroDelDia(opciones());
    for (const m of tablero) {
      expect(m.estado).toBe(m.tipo === 'secundaria' ? 'ofrecida' : 'aceptada');
    }
  });

  it('las tres secundarias son de categorías distintas', () => {
    for (const dia of ['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-20']) {
      const secundarias = generarTableroDelDia(opciones({ dia })).filter(
        (m) => m.tipo === 'secundaria',
      );
      expect(new Set(secundarias.map((m) => m.categoria)).size).toBe(secundarias.length);
    }
  });

  it('la principal sale de la categoría que manda', () => {
    const tablero = generarTableroDelDia(opciones({ categoriaPrincipal: 'habitos' }));
    expect(tablero.find((m) => m.tipo === 'principal')?.categoria).toBe('habitos');
  });

  it('no repite una plantilla más de dos veces por semana', () => {
    const gastadas = Object.fromEntries(MISIONES.map((m) => [m.key, 2]));
    const tablero = generarTableroDelDia(opciones({ usosEstaSemana: gastadas }));
    expect(tablero).toEqual([]);
  });

  it('ignora las categorías que todavía no se pueden registrar', () => {
    const tablero = generarTableroDelDia(opciones({ categoriasDisponibles: ['ocio'] }));
    expect(tablero.every((m) => m.categoria === 'ocio')).toBe(true);
  });

  it('la sorpresa no es diaria: ronda el 30% de los días', () => {
    let conSorpresa = 0;
    for (let i = 1; i <= 120; i++) {
      const dia = `2026-09-${String((i % 28) + 1).padStart(2, '0')}`;
      const tablero = generarTableroDelDia(opciones({ dia: `${dia}-${i}` }));
      if (tablero.some((m) => m.tipo === 'sorpresa')) conSorpresa++;
    }
    expect(conSorpresa).toBeGreaterThan(120 * 0.15);
    expect(conSorpresa).toBeLessThan(120 * 0.45);
  });

  it('la sorpresa lleva un efecto oculto', () => {
    for (let i = 0; i < 60; i++) {
      const sorpresa = generarTableroDelDia(opciones({ dia: `2026-10-${i}` })).find(
        (m) => m.tipo === 'sorpresa',
      );
      if (sorpresa) {
        expect(['doble-xp', 'bonus-fijo', 'logro-secreto']).toContain(sorpresa.efecto);
        return;
      }
    }
    throw new Error('no salio ninguna sorpresa en 60 dias');
  });
});

describe('misión semanal', () => {
  it('es determinista por semana y combina varias categorías', () => {
    const a = generarMisionSemanal({
      semana: '2026-W37',
      pool: MISIONES,
      categoriasDisponibles: CATEGORIAS,
    });
    const b = generarMisionSemanal({
      semana: '2026-W37',
      pool: MISIONES,
      categoriasDisponibles: CATEGORIAS,
    });
    expect(a).toEqual(b);
    expect(a?.tipo).toBe('semanal');
    expect(a?.xp).toBeGreaterThanOrEqual(400);
  });
});

describe('progreso de los objetivos', () => {
  const registros: RegistroParaObjetivo[] = [
    { categoria: 'fisico', actividad: 'act-correr', minutos: 30 },
    { categoria: 'fisico', actividad: 'act-gimnasio', minutos: 45 },
    { categoria: 'mental', actividad: 'act-leer', minutos: 20 },
  ];

  it('suma minutos por categoría', () => {
    expect(
      progresoObjetivo({ tipo: 'minutosCategoria', categoria: 'fisico', minutos: 45 }, registros),
    ).toEqual({ actual: 75, meta: 45, hecho: true });
  });

  it('suma minutos por actividad', () => {
    expect(
      progresoObjetivo({ tipo: 'minutosActividad', actividad: 'act-leer', minutos: 60 }, registros),
    ).toEqual({ actual: 20, meta: 60, hecho: false });
  });

  it('cuenta sesiones', () => {
    expect(
      progresoObjetivo({ tipo: 'sesionesCategoria', categoria: 'fisico', sesiones: 2 }, registros)
        .hecho,
    ).toBe(true);
    expect(
      progresoObjetivo({ tipo: 'sesionesActividad', actividad: 'act-correr', sesiones: 2 }, registros)
        .hecho,
    ).toBe(false);
  });

  it('cuenta categorías distintas', () => {
    expect(progresoObjetivo({ tipo: 'categoriasDistintas', categorias: 2 }, registros)).toEqual({
      actual: 2,
      meta: 2,
      hecho: true,
    });
  });

  it('suma minutos totales', () => {
    expect(progresoObjetivo({ tipo: 'minutosTotales', minutos: 100 }, registros).actual).toBe(95);
  });

  it('un día sin registros no completa nada', () => {
    expect(progresoObjetivo({ tipo: 'minutosTotales', minutos: 20 }, []).hecho).toBe(false);
  });

  it('el texto no pasa de la meta', () => {
    const objetivo = { tipo: 'minutosCategoria', categoria: 'fisico', minutos: 45 } as const;
    expect(textoProgreso(objetivo, progresoObjetivo(objetivo, registros))).toBe('45 / 45 min');
  });
});
