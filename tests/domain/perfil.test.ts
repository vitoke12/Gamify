import { describe, expect, it } from 'vitest';
import {
  cuotasRelativas,
  estadoDeCategorias,
  fraseDeContexto,
  puntosDisponibles,
} from '@/lib/domain/perfil';
import { progresoDesdeXp } from '@/lib/domain/niveles';

describe('estado de categorias', () => {
  it('deriva nivel y puntos de la XP acumulada', () => {
    const estados = estadoDeCategorias({ fisico: 1000, mental: 0 }, ['fisico', 'mental']);
    expect(estados[0]).toMatchObject({ categoriaId: 'fisico', nivel: 4, puntosGanados: 3 });
    expect(estados[1]).toMatchObject({ categoriaId: 'mental', nivel: 1, puntosGanados: 0 });
  });
});

describe('cuotas relativas', () => {
  it('mide cada categoria contra la media, no contra la mayor', () => {
    const cuotas = cuotasRelativas({ fisico: 600, mental: 300, habitos: 0 }, [
      'fisico',
      'mental',
      'habitos',
    ]);
    // media = 300: fisico va al doble, mental justo, habitos a cero
    expect(cuotas.fisico).toBe(2);
    expect(cuotas.mental).toBe(1);
    expect(cuotas.habitos).toBe(0);
  });

  it('el primer dia no hay nada descuidado, solo una app recien abierta', () => {
    expect(cuotasRelativas({}, ['fisico', 'mental'])).toEqual({ fisico: 1, mental: 1 });
  });

  it('no cuenta las categorias que no se pasan', () => {
    expect(cuotasRelativas({ fisico: 100, mental: 50 }, ['fisico'])).toEqual({ fisico: 1 });
  });
});

describe('puntos disponibles', () => {
  it('resta lo gastado a lo ganado por niveles', () => {
    const estados = estadoDeCategorias({ fisico: 1000 }, ['fisico']);
    expect(puntosDisponibles(estados, { fisico: 2 })).toEqual({ fisico: 1 });
    expect(puntosDisponibles(estados, {})).toEqual({ fisico: 3 });
  });
});

describe('frase de contexto', () => {
  it('traduce la XP que falta a esfuerzo real', () => {
    expect(fraseDeContexto(progresoDesdeXp(40))).toContain('un rato');
    expect(fraseDeContexto(progresoDesdeXp(180))).toContain('una sesion larga');
    expect(fraseDeContexto(progresoDesdeXp(1000))).toMatch(/sesiones|semanas/);
  });
});
