import { describe, expect, it } from 'vitest';
import { abrirCofre, describirRecompensa } from '@/lib/domain/cofres';

describe('cofre de la misión semanal', () => {
  it('el mismo cofre da siempre lo mismo: no se puede recargar', () => {
    expect(abrirCofre('semana-37')).toEqual(abrirCofre('semana-37'));
  });

  it('es impredecible en tipo', () => {
    const tipos = new Set(
      Array.from({ length: 200 }, (_, i) => abrirCofre(`s${i}`).tipo),
    );
    expect(tipos.size).toBe(4);
  });

  it('es impredecible en magnitud, no solo en tipo', () => {
    const cuantias = new Set(
      Array.from({ length: 300 }, (_, i) => abrirCofre(`m${i}`))
        .filter((r) => r.tipo === 'xp')
        .map((r) => (r.tipo === 'xp' ? r.xp : 0)),
    );
    expect(cuantias.size).toBeGreaterThan(15);
  });

  it('se mantiene dentro de rangos sanos', () => {
    for (let i = 0; i < 300; i++) {
      const r = abrirCofre(`r${i}`);
      if (r.tipo === 'xp') {
        expect(r.xp).toBeGreaterThanOrEqual(120);
        expect(r.xp).toBeLessThanOrEqual(900);
      }
      if (r.tipo === 'multiplicador') {
        expect(r.multiplicador).toBeGreaterThanOrEqual(1.1);
        expect(r.multiplicador).toBeLessThanOrEqual(1.5);
        expect(r.dias).toBeGreaterThanOrEqual(1);
        expect(r.dias).toBeLessThanOrEqual(3);
      }
      if (r.tipo === 'titulo') expect(r.titulo.length).toBeGreaterThan(0);
      if (r.tipo === 'cosmetico') expect(r.cosmetico.length).toBeGreaterThan(0);
    }
  });

  it('se describe en una linea legible', () => {
    for (let i = 0; i < 40; i++) {
      expect(describirRecompensa(abrirCofre(`d${i}`)).length).toBeGreaterThan(5);
    }
  });
});
