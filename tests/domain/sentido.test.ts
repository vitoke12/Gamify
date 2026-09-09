import { describe, expect, it } from 'vitest';
import {
  alertasDeSentido,
  categoriasAPreguntar,
  type CategoriaChequeable,
  type RespuestaSentido,
} from '@/lib/domain/sentido';

function cat(over: Partial<CategoriaChequeable> & { key: string }): CategoriaChequeable {
  return { primerDia: '2026-01-01', activaEnElPeriodo: true, ...over };
}

describe('a quien preguntar', () => {
  const hoy = '2026-09-09';

  it('pregunta por las categorias que llevas trabajando un mes o mas', () => {
    expect(categoriasAPreguntar([cat({ key: 'fisico' })], new Set(), hoy)).toEqual(['fisico']);
  });

  it('no pregunta por algo que empezaste anteayer', () => {
    expect(
      categoriasAPreguntar([cat({ key: 'fisico', primerDia: '2026-09-07' })], new Set(), hoy),
    ).toEqual([]);
  });

  it('justo a los 30 dias ya pregunta', () => {
    expect(
      categoriasAPreguntar([cat({ key: 'fisico', primerDia: '2026-08-10' })], new Set(), hoy),
    ).toEqual(['fisico']);
  });

  it('no pregunta por lo que no estas tocando este periodo', () => {
    expect(
      categoriasAPreguntar([cat({ key: 'fisico', activaEnElPeriodo: false })], new Set(), hoy),
    ).toEqual([]);
  });

  it('no repite la pregunta si ya la contestaste', () => {
    expect(categoriasAPreguntar([cat({ key: 'fisico' })], new Set(['fisico']), hoy)).toEqual([]);
  });

  it('ignora una categoria sin ningun registro', () => {
    expect(categoriasAPreguntar([cat({ key: 'social', primerDia: null })], new Set(), hoy)).toEqual(
      [],
    );
  });
});

describe('alertas', () => {
  const r = (categoria: string, periodo: string, respuesta: 'si' | 'algo' | 'no'): RespuestaSentido => ({
    categoria,
    periodo,
    respuesta,
  });

  it('un no suelto no señala nada: puede ser un mes malo', () => {
    expect(alertasDeSentido([r('fisico', '2026-08', 'no')])).toEqual([]);
  });

  it('dos noes en las ultimas tres respuestas si señalan', () => {
    const alertas = alertasDeSentido([
      r('fisico', '2026-07', 'no'),
      r('fisico', '2026-08', 'algo'),
      r('fisico', '2026-09', 'no'),
    ]);
    expect(alertas).toHaveLength(1);
    expect(alertas[0]).toMatchObject({ categoria: 'fisico', negativas: 2 });
  });

  it('solo mira las tres ultimas: un mal trimestre viejo no persigue para siempre', () => {
    const alertas = alertasDeSentido([
      r('mental', '2026-01', 'no'),
      r('mental', '2026-02', 'no'),
      r('mental', '2026-07', 'si'),
      r('mental', '2026-08', 'si'),
      r('mental', '2026-09', 'si'),
    ]);
    expect(alertas).toEqual([]);
  });

  it('no señala lo que si se nota fuera', () => {
    expect(
      alertasDeSentido([r('ocio', '2026-08', 'si'), r('ocio', '2026-09', 'algo')]),
    ).toEqual([]);
  });

  it('señala varias categorias a la vez', () => {
    const alertas = alertasDeSentido([
      r('fisico', '2026-08', 'no'),
      r('fisico', '2026-09', 'no'),
      r('social', '2026-08', 'no'),
      r('social', '2026-09', 'no'),
    ]);
    expect(alertas.map((a) => a.categoria).sort()).toEqual(['fisico', 'social']);
  });
});
