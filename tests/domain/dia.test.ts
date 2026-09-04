import { describe, expect, it } from 'vitest';
import {
  diaLogico,
  diferenciaDias,
  esDiaConsecutivo,
  lunesDe,
  mesDe,
  semanaIso,
  sumarDias,
} from '@/lib/domain/dia';

// Las fechas se construyen en hora local, igual que las lee la app,
// asi que el test no depende de la zona horaria de la maquina.

describe('dia logico con corte a las 05:00', () => {
  it('una sesion de madrugada cuenta en el dia anterior', () => {
    expect(diaLogico(new Date(2026, 8, 4, 2, 0))).toBe('2026-09-03');
    expect(diaLogico(new Date(2026, 8, 4, 4, 59))).toBe('2026-09-03');
  });

  it('el dia nuevo empieza exactamente a las 05:00', () => {
    expect(diaLogico(new Date(2026, 8, 4, 5, 0))).toBe('2026-09-04');
    expect(diaLogico(new Date(2026, 8, 4, 23, 59))).toBe('2026-09-04');
  });

  it('respeta una hora de corte distinta', () => {
    expect(diaLogico(new Date(2026, 8, 4, 5, 0), 8)).toBe('2026-09-03');
    expect(diaLogico(new Date(2026, 8, 4, 5, 0), 0)).toBe('2026-09-04');
  });
});

describe('aritmetica de dias', () => {
  it('cruza meses y anios', () => {
    expect(sumarDias('2026-02-28', 1)).toBe('2026-03-01');
    expect(sumarDias('2025-12-31', 1)).toBe('2026-01-01');
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('mide la distancia entre dos dias', () => {
    expect(diferenciaDias('2026-09-01', '2026-09-04')).toBe(3);
    expect(diferenciaDias('2026-09-04', '2026-09-01')).toBe(-3);
    expect(diferenciaDias('2026-09-04', '2026-09-04')).toBe(0);
  });

  it('detecta dias consecutivos, que es lo que sostiene la racha', () => {
    expect(esDiaConsecutivo('2026-09-03', '2026-09-04')).toBe(true);
    expect(esDiaConsecutivo('2026-09-02', '2026-09-04')).toBe(false);
    expect(esDiaConsecutivo('2026-02-28', '2026-03-01')).toBe(true);
  });

  it('extrae el mes natural para el cupo de congeladores', () => {
    expect(mesDe('2026-09-04')).toBe('2026-09');
  });
});

describe('semana ISO', () => {
  it('numera la semana de un dia cualquiera', () => {
    expect(semanaIso('2026-09-04')).toBe('2026-W36');
  });

  it('asigna el final de diciembre a la semana 1 del anio siguiente', () => {
    expect(semanaIso('2025-12-29')).toBe('2026-W01');
    expect(semanaIso('2026-01-01')).toBe('2026-W01');
  });

  it('encuentra el lunes de la semana', () => {
    expect(lunesDe('2026-09-04')).toBe('2026-08-31');
    expect(lunesDe('2026-08-31')).toBe('2026-08-31');
  });
});
