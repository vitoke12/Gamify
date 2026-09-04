import { describe, expect, it } from 'vitest';
import {
  categoriaMasDescuidada,
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

describe('categoria descuidada', () => {
  it('senala la de menos XP entre las registrables', () => {
    expect(
      categoriaMasDescuidada({ fisico: 5000, mental: 200, habitos: 900 }, [
        'fisico',
        'mental',
        'habitos',
      ]),
    ).toBe('mental');
  });

  it('no senala ninguna si todavia no hay nada registrado', () => {
    expect(categoriaMasDescuidada({}, ['fisico', 'mental'])).toBeNull();
  });

  it('no cuenta las categorias que aun no se pueden registrar', () => {
    expect(categoriaMasDescuidada({ fisico: 100, mental: 50 }, ['fisico'])).toBe('fisico');
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
