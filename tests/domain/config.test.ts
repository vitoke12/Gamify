import { describe, expect, it } from 'vitest';
import { ACTIVIDADES, ARBOLES, CATEGORIAS, validarConfig } from '@config/index';

describe('integridad del config', () => {
  it('no tiene ningun problema estructural', () => {
    expect(validarConfig()).toEqual([]);
  });

  it('define las diez categorias en tres esferas', () => {
    expect(CATEGORIAS).toHaveLength(10);
    expect(new Set(CATEGORIAS.map((c) => c.esfera))).toEqual(
      new Set(['interior', 'expresion', 'base']),
    );
  });

  it('trae tres arboles vivos en el seed inicial', () => {
    expect(ARBOLES.map((a) => a.categoria)).toEqual(['fisico', 'mental', 'habitos']);
  });

  it('ocio consciente se puede registrar aunque no tenga arbol', () => {
    const ocio = CATEGORIAS.find((c) => c.key === 'ocio');
    expect(ocio?.activa).toBe(true);
    expect(ARBOLES.some((a) => a.categoria === 'ocio')).toBe(false);
    expect(ACTIVIDADES.filter((a) => a.categoria === 'ocio').length).toBeGreaterThan(0);
  });
});

describe('rama de kitesurf', () => {
  const kite = ARBOLES.find((a) => a.categoria === 'fisico')!.ramas.find(
    (r) => r.key === 'kitesurf',
  )!;
  const porKey = new Map(kite.nodos.map((n) => [n.key, n]));

  it('arranca con dos nodos paralelos sin prerrequisito', () => {
    const tier1 = kite.nodos.filter((n) => n.tier === 1);
    expect(tier1.map((n) => n.key)).toEqual(['kite-seguridad', 'kite-montaje']);
    expect(tier1.every((n) => n.requiere.length === 0)).toBe(true);
  });

  it('el tier 2 exige el tier 1 completo', () => {
    for (const key of ['kite-bodydrag', 'kite-waterstart']) {
      expect(porKey.get(key)!.requiere.sort()).toEqual(['kite-montaje', 'kite-seguridad']);
    }
  });

  it('navegacion es el cuello de botella unico del tier 3', () => {
    const tier3 = kite.nodos.filter((n) => n.tier === 3);
    expect(tier3).toHaveLength(1);
    expect(tier3[0].key).toBe('kite-navegacion');
    expect(tier3[0].requiere.sort()).toEqual(['kite-bodydrag', 'kite-waterstart']);
  });

  it('los dos caminos del tier 4 pasan por navegacion', () => {
    const tier4 = kite.nodos.filter((n) => n.tier === 4);
    expect(tier4.map((n) => n.key)).toEqual(['kite-freestyle', 'kite-olas']);
    expect(tier4.every((n) => n.requiere.includes('kite-navegacion'))).toBe(true);
  });

  it('la maestria no se compra con puntos: se verifica con un reto', () => {
    const maestria = porKey.get('kite-maestria')!;
    expect(maestria.tier).toBe(5);
    expect(maestria.esMaestria).toBe(true);
    expect(maestria.costePuntos).toBe(0);
    expect(maestria.retoDescripcion).toBeTruthy();
  });
});
