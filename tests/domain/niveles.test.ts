import { describe, expect, it } from 'vitest';
import {
  progresoDesdeXp,
  puntosPorNivelAlcanzado,
  xpAcumuladaParaNivel,
  xpParaSubirDeNivel,
} from '@/lib/domain/niveles';

describe('curva de niveles', () => {
  it('el nivel 1 cuesta 80 XP', () => {
    expect(xpParaSubirDeNivel(1)).toBe(80);
  });

  it('el nivel 15 ronda los 10.500 XP', () => {
    expect(xpParaSubirDeNivel(15)).toBe(10_473);
    expect(xpParaSubirDeNivel(15)).toBeGreaterThan(10_000);
    expect(xpParaSubirDeNivel(15)).toBeLessThan(11_000);
  });

  it('es estrictamente creciente', () => {
    for (let n = 1; n < 40; n++) {
      expect(xpParaSubirDeNivel(n + 1)).toBeGreaterThan(xpParaSubirDeNivel(n));
    }
  });

  it('los primeros niveles caen rapido y los altos exigen compromiso', () => {
    // Nivel 5 en menos de 2.000 XP: unas seis sesiones de una hora.
    expect(xpAcumuladaParaNivel(5)).toBe(1_907);
    // Nivel 15 pide 50.972 XP acumulados: eso ya son meses.
    expect(xpAcumuladaParaNivel(15)).toBe(50_972);
  });
});

describe('xpAcumuladaParaNivel', () => {
  it('empieza en 0 y suma los costes de los niveles anteriores', () => {
    expect(xpAcumuladaParaNivel(1)).toBe(0);
    expect(xpAcumuladaParaNivel(2)).toBe(80);
    expect(xpAcumuladaParaNivel(3)).toBe(80 + 279);
  });
});

describe('progresoDesdeXp', () => {
  it('un perfil recien creado esta en nivel 1 sin progreso', () => {
    const p = progresoDesdeXp(0);
    expect(p).toMatchObject({ nivel: 1, xpEnNivel: 0, xpRestante: 80, progreso: 0 });
  });

  it('sube de nivel justo al alcanzar el umbral, no antes', () => {
    expect(progresoDesdeXp(79).nivel).toBe(1);
    expect(progresoDesdeXp(80).nivel).toBe(2);
    expect(progresoDesdeXp(358).nivel).toBe(2);
    expect(progresoDesdeXp(359).nivel).toBe(3);
    expect(progresoDesdeXp(50_971).nivel).toBe(14);
    expect(progresoDesdeXp(50_972).nivel).toBe(15);
  });

  it('reporta lo que falta para el siguiente nivel', () => {
    const p = progresoDesdeXp(100);
    expect(p.nivel).toBe(2);
    expect(p.xpEnNivel).toBe(20);
    expect(p.xpParaSiguienteNivel).toBe(279);
    expect(p.xpRestante).toBe(259);
    expect(p.progreso).toBeCloseTo(20 / 279, 5);
  });

  it('trata la XP negativa o fraccionaria sin romperse', () => {
    expect(progresoDesdeXp(-500).nivel).toBe(1);
    expect(progresoDesdeXp(80.9).nivel).toBe(2);
  });
});

describe('puntos de habilidad', () => {
  it('da un punto por nivel, y el nivel 1 no da ninguno', () => {
    expect(puntosPorNivelAlcanzado(1)).toBe(0);
    expect(puntosPorNivelAlcanzado(5)).toBe(4);
  });
});
