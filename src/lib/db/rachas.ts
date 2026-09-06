/**
 * Puesta al día de las rachas. Se ejecuta al abrir Home: no hay cron, y no
 * hace falta — es idempotente, así que llamarla mil veces al día da lo mismo
 * que llamarla una.
 *
 * Los congeladores se gastan solos, pero dejan rastro: cada día perdonado se
 * guarda en StreakFreeze y se devuelve como aviso, porque consumir uno en
 * silencio sería quitarle al usuario la información que más le importa.
 */
import { avanzarRacha } from '@/lib/domain/rachas';
import { mesDe } from '@/lib/domain/dia';
import { PERFIL, prisma } from './prisma';
import { diaDeHoy } from './consultas';

export type AvisoCongelador = {
  clave: string;
  etiqueta: string;
  diasPerdonados: string[];
  congeladoresRestantes: number;
};

export async function sincronizarRachas(): Promise<AvisoCongelador[]> {
  const hoy = await diaDeHoy();

  const [rachas, dias] = await Promise.all([
    prisma.streak.findMany({
      where: { profileId: PERFIL },
      include: { category: true, congelados: true },
    }),
    prisma.activityLog.findMany({
      where: { profileId: PERFIL },
      select: { diaLogico: true, categoryId: true },
      distinct: ['diaLogico', 'categoryId'],
    }),
  ]);

  const avisos: AvisoCongelador[] = [];

  for (const racha of rachas) {
    const diasConActividad = racha.categoryId
      ? dias.filter((d) => d.categoryId === racha.categoryId).map((d) => d.diaLogico)
      : dias.map((d) => d.diaLogico);

    const perdonadosPrevios = racha.congelados.map((c) => c.diaLogico);

    const resultado = avanzarRacha(diasConActividad, perdonadosPrevios, hoy, {
      restantes: racha.congeladoresRestantes,
      mesDelCupo: racha.congeladoresMes || mesDe(hoy),
    });

    const sinCambios =
      racha.diasActuales === resultado.racha.diasActuales &&
      racha.diasMaximos === resultado.racha.diasMaximos &&
      racha.ultimoDiaLogico === resultado.racha.ultimoDia &&
      racha.congeladoresRestantes === resultado.congeladores.restantes &&
      racha.congeladoresMes === resultado.congeladores.mesDelCupo;

    if (!sinCambios || resultado.nuevosPerdonados.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.streak.update({
          where: { id: racha.id },
          data: {
            diasActuales: resultado.racha.diasActuales,
            diasMaximos: resultado.racha.diasMaximos,
            ultimoDiaLogico: resultado.racha.ultimoDia,
            congeladoresRestantes: resultado.congeladores.restantes,
            congeladoresMes: resultado.congeladores.mesDelCupo,
          },
        });
        for (const dia of resultado.nuevosPerdonados) {
          await tx.streakFreeze.create({ data: { streakId: racha.id, diaLogico: dia } });
        }
      });
    }

    if (resultado.nuevosPerdonados.length > 0) {
      avisos.push({
        clave: racha.clave,
        etiqueta: racha.category?.nombre ?? 'Racha global',
        diasPerdonados: resultado.nuevosPerdonados,
        congeladoresRestantes: resultado.congeladores.restantes,
      });
    }
  }

  return avisos;
}

/** Congeladores que le quedan este mes a la racha global. */
export async function congeladoresGlobales(): Promise<number> {
  const racha = await prisma.streak.findUnique({
    where: { profileId_clave: { profileId: PERFIL, clave: 'global' } },
  });
  return racha?.congeladoresRestantes ?? 0;
}
