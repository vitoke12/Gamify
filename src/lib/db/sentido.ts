/**
 * Chequeo de sentido: qué preguntar este mes y qué está saliendo mal.
 */
import {
  alertasDeSentido,
  categoriasAPreguntar,
  type Alerta,
  type RespuestaSentido,
} from '@/lib/domain/sentido';
import { mesDe } from '@/lib/domain/dia';
import type { RespuestaChequeo } from '@/lib/domain/tipos';
import { PERFIL, prisma } from './prisma';
import { diaDeHoy } from './consultas';

export type PreguntaSentido = { categoria: string; nombre: string; esfera: string };

export type EstadoSentido = {
  periodo: string;
  preguntas: PreguntaSentido[];
  alertas: (Alerta & { nombre: string })[];
};

export async function estadoDelChequeo(): Promise<EstadoSentido> {
  const hoy = await diaDeHoy();
  const periodo = mesDe(hoy);

  const [categorias, logs, respondidas, todas] = await Promise.all([
    prisma.category.findMany({ where: { activa: true }, orderBy: { orden: 'asc' } }),
    prisma.activityLog.findMany({
      where: { profileId: PERFIL },
      select: { diaLogico: true, category: { select: { key: true } } },
      orderBy: { diaLogico: 'asc' },
    }),
    prisma.senseCheck.findMany({
      where: { profileId: PERFIL, periodo },
      include: { category: { select: { key: true } } },
    }),
    prisma.senseCheck.findMany({
      where: { profileId: PERFIL },
      include: { category: { select: { key: true } } },
    }),
  ]);

  const primerDia = new Map<string, string>();
  const activaEnElPeriodo = new Set<string>();
  for (const l of logs) {
    if (!primerDia.has(l.category.key)) primerDia.set(l.category.key, l.diaLogico);
    if (mesDe(l.diaLogico) === periodo) activaEnElPeriodo.add(l.category.key);
  }

  const keys = categoriasAPreguntar(
    categorias.map((c) => ({
      key: c.key,
      primerDia: primerDia.get(c.key) ?? null,
      activaEnElPeriodo: activaEnElPeriodo.has(c.key),
    })),
    new Set(respondidas.map((r) => r.category.key)),
    hoy,
  );

  const porKey = new Map(categorias.map((c) => [c.key, c]));
  const respuestas: RespuestaSentido[] = todas.map((r) => ({
    categoria: r.category.key,
    periodo: r.periodo,
    respuesta: r.respuesta as RespuestaChequeo,
  }));

  return {
    periodo,
    preguntas: keys.map((key) => ({
      categoria: key,
      nombre: porKey.get(key)?.nombre ?? key,
      esfera: porKey.get(key)?.esfera ?? 'base',
    })),
    alertas: alertasDeSentido(respuestas).map((a) => ({
      ...a,
      nombre: porKey.get(a.categoria)?.nombre ?? a.categoria,
    })),
  };
}

export async function guardarRespuesta(
  categoriaKey: string,
  respuesta: RespuestaChequeo,
): Promise<{ ok: boolean; error?: string }> {
  const categoria = await prisma.category.findUnique({ where: { key: categoriaKey } });
  if (!categoria) return { ok: false, error: 'Esa categoría no existe' };

  const periodo = mesDe(await diaDeHoy());
  await prisma.senseCheck.upsert({
    where: {
      profileId_categoryId_periodo: { profileId: PERFIL, categoryId: categoria.id, periodo },
    },
    update: { respuesta },
    create: { categoryId: categoria.id, periodo, respuesta },
  });
  return { ok: true };
}
