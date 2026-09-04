/**
 * Motor de XP.
 *
 *   XP = xpBasePorMinuto * duracion * intensidad * dificultad * PI(modificadores)
 *
 * El registro es un log inmutable: nunca se guarda un total mutable que se va
 * sumando. Cada log guarda su XP y los factores que lo produjeron, asi que
 * cambiar la formula manana permite recalcular todo el historial.
 *
 * Se recalcula el DIA ENTERO en cada escritura, no solo el log nuevo. Es
 * deliberado: la sinergia (dos categorias distintas el mismo dia) es
 * retroactiva, y el tope diario y el decaimiento por repeticion dependen de
 * lo ya registrado. Recalcular el dia completo hace que el resultado no
 * dependa del orden en que se escribieron los logs y sea reproducible.
 */
import { ECONOMIA } from '@config/economia';
import { diaLogico } from './dia';
import { dificultadRelativa } from './dificultad';
import { calcularModificadores } from './modificadores';
import type { ContextoCalculo, EntradaRegistro, LogCalculado } from './tipos';

/**
 * Recalcula todos los logs de un mismo dia logico.
 * Las entradas pueden venir en cualquier orden; se ordenan cronologicamente.
 */
export function recalcularDia(
  entradas: readonly EntradaRegistro[],
  contexto: ContextoCalculo,
): LogCalculado[] {
  const ordenadas = [...entradas].sort(
    (a, b) => a.fecha.getTime() - b.fecha.getTime() || a.id.localeCompare(b.id),
  );

  const categoriasDelDia = new Set(
    ordenadas
      .map((e) => contexto.actividades[e.actividadId]?.categoriaId)
      .filter((c): c is string => Boolean(c)),
  );
  const haySinergia = categoriasDelDia.size > 1;

  const minutosUsadosPorCategoria: Record<string, number> = {};
  const vecesActividadHoy: Record<string, number> = {};

  return ordenadas.map((entrada) => {
    const actividad = contexto.actividades[entrada.actividadId];
    if (!actividad) {
      throw new Error(`Actividad desconocida en el contexto: ${entrada.actividadId}`);
    }

    const categoriaId = actividad.categoriaId;

    // Tope diario por categoria: lo que exceda se registra igual, pero no
    // puntua. La sesion ocurrio; la economia no se rompe.
    const duracionBrutaMin = entrada.cantidad * actividad.minutosPorUnidad;
    const tope =
      contexto.topeDiarioPorCategoria[categoriaId] ?? ECONOMIA.topeDiarioMinPorDefecto;
    const yaUsados = minutosUsadosPorCategoria[categoriaId] ?? 0;
    const duracionMin = Math.max(0, Math.min(duracionBrutaMin, tope - yaUsados));
    minutosUsadosPorCategoria[categoriaId] = yaUsados + duracionMin;

    const ocurrenciaEnElDia = vecesActividadHoy[entrada.actividadId] ?? 0;
    vecesActividadHoy[entrada.actividadId] = ocurrenciaEnElDia + 1;

    const esPrimeraVez =
      !contexto.actividadesYaVistas.has(entrada.actividadId) && ocurrenciaEnElDia === 0;

    const dificultad = dificultadRelativa(actividad, contexto.nivelPorNodo);

    const mods = calcularModificadores({
      categoriaId,
      diasRacha: contexto.diasRachaPorCategoria[categoriaId] ?? 0,
      esPrimeraVez,
      haySinergia,
      tieneEvidencia: entrada.tieneEvidencia,
      esCategoriaDescuidada: contexto.categoriaDescuidada === categoriaId,
      ocurrenciaEnElDia,
      clase: contexto.clase,
    });

    const xpBase = actividad.xpBasePorMinuto * duracionMin;
    const xpCalculado = Math.round(
      xpBase * entrada.intensidad * dificultad * mods.productoTopado,
    );

    return {
      id: entrada.id,
      actividadId: entrada.actividadId,
      categoriaId,
      fecha: entrada.fecha,
      diaLogico: diaLogico(entrada.fecha, contexto.horaCorteDia),
      cantidad: entrada.cantidad,
      duracionBrutaMin,
      duracionMin,
      intensidad: entrada.intensidad,
      dificultadRelativa: dificultad,
      modificadores: mods.detalle,
      productoModificadores: mods.productoTopado,
      xpBase: Math.round(xpBase),
      xpCalculado,
      versionFormula: ECONOMIA.version,
    };
  });
}

/** XP total de una tanda de logs ya calculados. */
export function xpTotal(logs: readonly LogCalculado[]): number {
  return logs.reduce((acc, l) => acc + l.xpCalculado, 0);
}

/** XP por categoria de una tanda de logs ya calculados. */
export function xpPorCategoria(logs: readonly LogCalculado[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const l of logs) acc[l.categoriaId] = (acc[l.categoriaId] ?? 0) + l.xpCalculado;
  return acc;
}
