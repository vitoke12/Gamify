/**
 * Clases y su historial.
 *
 * El snapshot del mes en curso se reescribe cada vez: la clase puede cambiar
 * a mitad de mes y lo que interesa guardar es en qué acabó. Los meses
 * cerrados no se tocan nunca, y esa secuencia es el historial.
 */
import { calcularClase, capitulos, type CapituloClase, type Clase } from '@/lib/domain/clases';
import { mesDe } from '@/lib/domain/dia';
import { progresoDesdeXp } from '@/lib/domain/niveles';
import { aJson, deJson } from './json';
import { PERFIL, prisma } from './prisma';
import { diaDeHoy, xpPorCategoria } from './consultas';

export async function claseActual(): Promise<Clase | null> {
  const [xpKeys, categorias] = await Promise.all([
    xpPorCategoria(),
    prisma.category.findMany({ orderBy: { orden: 'asc' }, select: { key: true } }),
  ]);
  const niveles: Record<string, number> = {};
  for (const [key, xp] of Object.entries(xpKeys)) niveles[key] = progresoDesdeXp(xp).nivel;
  return calcularClase(niveles, categorias.map((c) => c.key));
}

export async function sincronizarClase(): Promise<{
  clase: Clase | null;
  historia: CapituloClase[];
  /** true si la clase ha cambiado respecto al mes anterior. */
  esNueva: boolean;
}> {
  const clase = await claseActual();
  const mes = mesDe(await diaDeHoy());

  let esNueva = false;
  if (clase) {
    const anterior = await prisma.classSnapshot.findFirst({
      where: { profileId: PERFIL, mes: { lt: mes } },
      orderBy: { mes: 'desc' },
    });
    const actual = await prisma.classSnapshot.findUnique({
      where: { profileId_mes: { profileId: PERFIL, mes } },
    });
    esNueva = actual === null && anterior?.claseKey !== clase.key;

    const datos = {
      claseKey: clase.key,
      tipo: clase.tipo,
      dominantesJson: aJson(clase.dominantes),
      distribucionJson: aJson(clase.distribucion),
    };
    await prisma.classSnapshot.upsert({
      where: { profileId_mes: { profileId: PERFIL, mes } },
      update: datos,
      create: { mes, ...datos },
    });
  }

  const snapshots = await prisma.classSnapshot.findMany({
    where: { profileId: PERFIL },
    orderBy: { mes: 'asc' },
  });

  return {
    clase,
    historia: capitulos(
      snapshots.map((s) => ({
        mes: s.mes,
        claseKey: s.claseKey,
        tipo: s.tipo,
        dominantes: deJson<string[]>(s.dominantesJson, []),
      })),
    ),
    esNueva,
  };
}
