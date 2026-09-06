import { describe, expect, it } from 'vitest';
import {
  estadoDeNodo,
  estadoRespec,
  nivelDeNodo,
  progresoDeNodo,
  puedeDesbloquear,
  puedeVerificarMaestria,
  puntosARecuperar,
  requisitosPendientes,
  umbralXpNodo,
  type NodoArbol,
  type ProgresoNodo,
} from '@/lib/domain/arbol';

function nodo(over: Partial<NodoArbol> & { id: string }): NodoArbol {
  return {
    key: over.id,
    nombre: over.id,
    descripcion: null,
    tier: 1,
    maxLevel: 5,
    costePuntos: 2,
    esMaestria: false,
    retoDescripcion: null,
    requiere: [],
    ...over,
  };
}

function progreso(over: Partial<ProgresoNodo> = {}): ProgresoNodo {
  return { desbloqueado: false, xpEnNodo: 0, maestriaVerificada: false, ...over };
}

describe('nivel del nodo', () => {
  it('escala en peldanos triangulares', () => {
    expect(umbralXpNodo(1)).toBe(0);
    expect(umbralXpNodo(2)).toBe(2_500);
    expect(umbralXpNodo(3)).toBe(7_500);
    expect(umbralXpNodo(4)).toBe(15_000);
    expect(umbralXpNodo(5)).toBe(25_000);
  });

  it('sube con la practica, no con los puntos', () => {
    expect(nivelDeNodo(0, 5)).toBe(1);
    expect(nivelDeNodo(2_499, 5)).toBe(1);
    expect(nivelDeNodo(2_500, 5)).toBe(2);
    expect(nivelDeNodo(7_500, 5)).toBe(3);
    expect(nivelDeNodo(25_000, 5)).toBe(5);
  });

  it('no pasa del maximo del nodo', () => {
    expect(nivelDeNodo(999_999, 3)).toBe(3);
    expect(nivelDeNodo(999_999, 1)).toBe(1);
  });

  it('da el progreso dentro del nivel para la barra', () => {
    expect(progresoDeNodo(0, 5)).toBe(0);
    expect(progresoDeNodo(1_250, 5)).toBe(0.5);
    expect(progresoDeNodo(25_000, 5)).toBe(1);
    expect(progresoDeNodo(999_999, 3)).toBe(1);
  });
});

describe('requisitos', () => {
  const bodydrag = nodo({ id: 'bodydrag', tier: 2, requiere: ['seguridad', 'montaje'] });

  it('senala exactamente lo que falta', () => {
    expect(requisitosPendientes(bodydrag, {})).toEqual(['seguridad', 'montaje']);
    expect(
      requisitosPendientes(bodydrag, { seguridad: progreso({ desbloqueado: true }) }),
    ).toEqual(['montaje']);
  });

  it('basta con tener el previo desbloqueado, no dominado', () => {
    const progresos = {
      seguridad: progreso({ desbloqueado: true, xpEnNodo: 0 }),
      montaje: progreso({ desbloqueado: true, xpEnNodo: 0 }),
    };
    expect(requisitosPendientes(bodydrag, progresos)).toEqual([]);
  });
});

describe('los cuatro estados del nodo', () => {
  const seguridad = nodo({ id: 'seguridad', maxLevel: 3 });
  const bodydrag = nodo({ id: 'bodydrag', requiere: ['seguridad'] });

  it('bloqueado mientras falten requisitos', () => {
    expect(estadoDeNodo(bodydrag, {})).toBe('bloqueado');
  });

  it('disponible cuando los requisitos estan y no se ha comprado', () => {
    expect(estadoDeNodo(bodydrag, { seguridad: progreso({ desbloqueado: true }) })).toBe(
      'disponible',
    );
  });

  it('en progreso una vez desbloqueado y por debajo del maximo', () => {
    expect(
      estadoDeNodo(seguridad, { seguridad: progreso({ desbloqueado: true, xpEnNodo: 3_000 }) }),
    ).toBe('en-progreso');
  });

  it('dominado al llegar al nivel maximo del nodo', () => {
    expect(
      estadoDeNodo(seguridad, { seguridad: progreso({ desbloqueado: true, xpEnNodo: 7_500 }) }),
    ).toBe('dominado');
  });
});

describe('nodo de maestria', () => {
  const maestria = nodo({
    id: 'maestria',
    esMaestria: true,
    costePuntos: 0,
    maxLevel: 1,
    requiere: ['freestyle'],
    retoDescripcion: 'Sesion grabada en un spot nuevo',
  });
  const conRequisito = { freestyle: progreso({ desbloqueado: true }) };

  it('no se compra con puntos por muchos que tengas', () => {
    const veredicto = puedeDesbloquear(maestria, conRequisito, 999);
    expect(veredicto).toMatchObject({ puede: false, motivo: 'maestria' });
  });

  it('queda disponible cuando los requisitos estan, a la espera del reto', () => {
    expect(estadoDeNodo(maestria, conRequisito)).toBe('disponible');
    expect(estadoDeNodo(maestria, {})).toBe('bloqueado');
  });

  it('exige una prueba escrita, no un toque', () => {
    expect(puedeVerificarMaestria(maestria, conRequisito, '')).toMatchObject({ puede: false });
    expect(puedeVerificarMaestria(maestria, conRequisito, 'ya esta')).toMatchObject({
      puede: false,
    });
    expect(
      puedeVerificarMaestria(maestria, conRequisito, 'Video del 3 de agosto en Tarifa, 22 nudos'),
    ).toEqual({ puede: true });
  });

  it('se marca dominado solo cuando esta verificada', () => {
    expect(
      estadoDeNodo(maestria, { ...conRequisito, maestria: progreso({ maestriaVerificada: true }) }),
    ).toBe('dominado');
  });
});

describe('desbloquear', () => {
  const nodoCaro = nodo({ id: 'navegacion', costePuntos: 3, requiere: ['bodydrag'] });
  const listo = { bodydrag: progreso({ desbloqueado: true }) };

  it('deja pasar con requisitos y puntos suficientes', () => {
    expect(puedeDesbloquear(nodoCaro, listo, 3)).toEqual({ puede: true });
  });

  it('explica que faltan puntos y cuantos', () => {
    const v = puedeDesbloquear(nodoCaro, listo, 2);
    expect(v).toMatchObject({ puede: false, motivo: 'puntos' });
    expect(v.puede === false && v.detalle).toContain('3');
  });

  it('no deja saltarse los requisitos', () => {
    expect(puedeDesbloquear(nodoCaro, {}, 99)).toMatchObject({
      puede: false,
      motivo: 'requisitos',
    });
  });

  it('no deja pagar dos veces el mismo nodo', () => {
    expect(
      puedeDesbloquear(nodoCaro, { ...listo, navegacion: progreso({ desbloqueado: true }) }, 99),
    ).toMatchObject({ puede: false, motivo: 'ya-desbloqueado' });
  });
});

describe('respec', () => {
  const nodos = [
    nodo({ id: 'a', costePuntos: 1 }),
    nodo({ id: 'b', costePuntos: 3 }),
    nodo({ id: 'c', costePuntos: 4 }),
    nodo({ id: 'm', costePuntos: 0, esMaestria: true }),
  ];

  it('devuelve todo lo invertido en los nodos comprados', () => {
    const progresos = {
      a: progreso({ desbloqueado: true }),
      b: progreso({ desbloqueado: true }),
      m: progreso({ maestriaVerificada: true }),
    };
    expect(puntosARecuperar(nodos, progresos)).toBe(4);
  });

  it('esta disponible la primera vez', () => {
    expect(estadoRespec(null, new Date(2026, 8, 6))).toEqual({
      disponible: true,
      diasRestantes: 0,
    });
  });

  it('bloquea 90 dias tras usarlo', () => {
    const hecho = new Date(2026, 8, 6);
    expect(estadoRespec(hecho, new Date(2026, 8, 16))).toEqual({
      disponible: false,
      diasRestantes: 80,
    });
    expect(estadoRespec(hecho, new Date(2026, 11, 5)).disponible).toBe(true);
  });
});
