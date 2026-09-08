/**
 * Recompensas de cofre. Vive aparte de las misiones porque el motor de XP
 * necesita el multiplicador activo, y misiones/consultas se importan entre
 * sí: meterlo ahí montaría un ciclo.
 */
import { describirRecompensa, type Recompensa } from '@/lib/domain/cofres';
import { PERFIL, prisma } from './prisma';
import { deJson } from './json';

/** Multiplicador de XP vigente por un cofre, si lo hay. */
export async function multiplicadorDeCofre(): Promise<number | undefined> {
  const premio = await prisma.reward.findFirst({
    where: { profileId: PERFIL, tipo: 'multiplicador', expiraEn: { gt: new Date() } },
    orderBy: { otorgadoEn: 'desc' },
  });
  if (!premio) return undefined;
  const recompensa = deJson<Recompensa>(premio.valorJson, { tipo: 'xp', xp: 0 });
  return recompensa.tipo === 'multiplicador' ? recompensa.multiplicador : undefined;
}

/**
 * Cofres ganados y todavía sin abrir. Se guardan en vez de enseñarse una vez
 * y perderse: la recompensa es el momento, y un destello que desaparece al
 * recargar la página no es un momento.
 */
export async function cofresSinAbrir() {
  const filas = await prisma.reward.findMany({
    where: { profileId: PERFIL, consumidoEn: null },
    orderBy: { otorgadoEn: 'asc' },
  });
  return filas.map((r) => ({ id: r.id, otorgadoEn: r.otorgadoEn }));
}

/** Abre uno y devuelve lo que había dentro. */
export async function abrirPremio(
  id: string,
): Promise<{ ok: true; descripcion: string; tipo: string } | { ok: false; error: string }> {
  const premio = await prisma.reward.findUnique({ where: { id } });
  if (!premio) return { ok: false, error: 'Ese cofre no existe' };
  if (premio.consumidoEn) return { ok: false, error: 'Ese cofre ya estaba abierto' };

  await prisma.reward.update({ where: { id }, data: { consumidoEn: new Date() } });
  const recompensa = deJson<Recompensa>(premio.valorJson, { tipo: 'xp', xp: 0 });
  return { ok: true, descripcion: describirRecompensa(recompensa), tipo: premio.tipo };
}

export type PremioVista = {
  id: string;
  tipo: string;
  descripcion: string;
  otorgadoEn: Date;
  expiraEn: Date | null;
  vigente: boolean;
};

/** Lo que ha salido de los cofres, para la pantalla de colección. */
export async function premios(): Promise<PremioVista[]> {
  const filas = await prisma.reward.findMany({
    where: { profileId: PERFIL },
    orderBy: { otorgadoEn: 'desc' },
  });
  return filas.map((r) => {
    const recompensa = deJson<Recompensa>(r.valorJson, { tipo: 'xp', xp: 0 });
    return {
      id: r.id,
      tipo: r.tipo,
      descripcion: describirRecompensa(recompensa),
      otorgadoEn: r.otorgadoEn,
      expiraEn: r.expiraEn,
      vigente: r.expiraEn ? r.expiraEn.getTime() > Date.now() : true,
    };
  });
}
