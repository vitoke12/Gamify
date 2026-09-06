import { describe, expect, it } from 'vitest';
import { avanzarRacha, calcularRacha } from '@/lib/domain/rachas';

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

describe('congeladores', () => {
  const cupoLleno = { restantes: 2, mesDelCupo: '2026-09' };

  it('no gasta nada si no falta ningun dia', () => {
    const r = avanzarRacha(['2026-09-05', '2026-09-06'], [], '2026-09-06', cupoLleno);
    expect(r.nuevosPerdonados).toEqual([]);
    expect(r.congeladores.restantes).toBe(2);
    expect(r.racha.diasActuales).toBe(2);
  });

  it('nunca perdona el dia de hoy: hoy todavia se puede registrar', () => {
    const r = avanzarRacha(['2026-09-05'], [], '2026-09-06', cupoLleno);
    expect(r.nuevosPerdonados).toEqual([]);
    expect(r.congeladores.restantes).toBe(2);
    expect(r.racha.enRiesgo).toBe(true);
  });

  it('gasta un congelador por el dia que falta y salva la racha', () => {
    const r = avanzarRacha(['2026-09-03', '2026-09-04'], [], '2026-09-06', cupoLleno);
    expect(r.nuevosPerdonados).toEqual(['2026-09-05']);
    expect(r.congeladores.restantes).toBe(1);
    expect(r.racha.diasActuales).toBe(3);
  });

  it('no se malgasta cuando el hueco es mayor que el cupo', () => {
    const r = avanzarRacha(['2026-09-02'], [], '2026-09-06', cupoLleno);
    expect(r.nuevosPerdonados).toEqual([]);
    expect(r.congeladores.restantes).toBe(2);
    expect(r.racha.diasActuales).toBe(0);
    expect(r.racha.diasMaximos).toBe(1);
  });

  it('renueva el cupo al cambiar de mes natural', () => {
    const r = avanzarRacha(['2026-08-31'], [], '2026-09-06', {
      restantes: 0,
      mesDelCupo: '2026-08',
    });
    expect(r.cupoRenovado).toBe(true);
    expect(r.congeladores.mesDelCupo).toBe('2026-09');
    expect(r.congeladores.restantes).toBe(2); // el hueco de 5 dias no se tapa
  });

  it('sin cupo, la racha se rompe', () => {
    const r = avanzarRacha(['2026-09-04'], [], '2026-09-06', {
      restantes: 0,
      mesDelCupo: '2026-09',
    });
    expect(r.nuevosPerdonados).toEqual([]);
    expect(r.racha.diasActuales).toBe(0);
  });

  it('tiene en cuenta los dias ya perdonados antes', () => {
    const r = avanzarRacha(['2026-09-03'], ['2026-09-04'], '2026-09-06', {
      restantes: 1,
      mesDelCupo: '2026-09',
    });
    expect(r.nuevosPerdonados).toEqual(['2026-09-05']);
    expect(r.congeladores.restantes).toBe(0);
    expect(r.racha.diasActuales).toBe(3);
  });
});
