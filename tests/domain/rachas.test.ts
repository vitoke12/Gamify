import { describe, expect, it } from 'vitest';
import { calcularRacha } from '@/lib/domain/rachas';

describe('calcular racha', () => {
  it('sin actividad no hay racha', () => {
    expect(calcularRacha([], '2026-09-04')).toEqual({
      diasActuales: 0,
      diasMaximos: 0,
      ultimoDia: null,
      enRiesgo: false,
    });
  });

  it('cuenta los dias consecutivos hasta hoy', () => {
    const r = calcularRacha(['2026-09-02', '2026-09-03', '2026-09-04'], '2026-09-04');
    expect(r.diasActuales).toBe(3);
    expect(r.enRiesgo).toBe(false);
  });

  it('sigue viva si el ultimo registro fue ayer, pero avisa', () => {
    const r = calcularRacha(['2026-09-02', '2026-09-03'], '2026-09-04');
    expect(r.diasActuales).toBe(2);
    expect(r.enRiesgo).toBe(true);
  });

  it('se rompe cuando se salta un dia entero', () => {
    const r = calcularRacha(['2026-09-01', '2026-09-02'], '2026-09-04');
    expect(r.diasActuales).toBe(0);
    expect(r.diasMaximos).toBe(2);
  });

  it('recuerda el maximo historico aunque la actual sea menor', () => {
    const dias = [
      '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
      '2026-09-03', '2026-09-04',
    ];
    const r = calcularRacha(dias, '2026-09-04');
    expect(r.diasActuales).toBe(2);
    expect(r.diasMaximos).toBe(5);
  });

  it('ignora dias duplicados: varias sesiones en un dia son un dia', () => {
    const r = calcularRacha(['2026-09-03', '2026-09-03', '2026-09-04'], '2026-09-04');
    expect(r.diasActuales).toBe(2);
  });

  it('un dia perdonado por congelador mantiene la cadena', () => {
    const r = calcularRacha(['2026-09-02', '2026-09-04'], '2026-09-04', ['2026-09-03']);
    expect(r.diasActuales).toBe(3);
  });
});
