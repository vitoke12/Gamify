import { describe, expect, it } from 'vitest';
import { crearAleatorio } from '@/lib/domain/rng';

describe('aleatorio con semilla', () => {
  it('la misma semilla da siempre la misma secuencia', () => {
    const a = crearAleatorio('2026-09-04');
    const b = crearAleatorio('2026-09-04');
    const sa = Array.from({ length: 10 }, a.siguiente);
    const sb = Array.from({ length: 10 }, b.siguiente);
    expect(sa).toEqual(sb);
  });

  it('semillas distintas dan secuencias distintas', () => {
    const a = crearAleatorio('2026-09-04');
    const b = crearAleatorio('2026-09-05');
    expect(a.siguiente()).not.toBe(b.siguiente());
  });

  it('produce numeros en [0, 1)', () => {
    const r = crearAleatorio('semilla');
    for (let i = 0; i < 500; i++) {
      const n = r.siguiente();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it('barajar no muta la entrada y conserva los elementos', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const r = crearAleatorio('x');
    const barajado = r.barajar(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...barajado].sort((a, b) => a - b)).toEqual(original);
  });

  it('entero respeta el rango', () => {
    const r = crearAleatorio('x');
    for (let i = 0; i < 200; i++) {
      const n = r.entero(3, 7);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThan(7);
    }
  });

  it('oportunidad(0) nunca y oportunidad(1) siempre', () => {
    const r = crearAleatorio('x');
    expect(Array.from({ length: 50 }, () => r.oportunidad(0)).some(Boolean)).toBe(false);
    expect(Array.from({ length: 50 }, () => r.oportunidad(1)).every(Boolean)).toBe(true);
  });
});
