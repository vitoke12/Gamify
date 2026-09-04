/**
 * Seed. Es un traductor: lee /config y lo vuelca en la base. No inventa
 * datos propios y es idempotente, asi que se puede volver a lanzar cada vez
 * que cambien las reglas del juego sin perder el historial del jugador.
 */
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { ACTIVIDADES } from '../config/actividades';
import { ARBOLES } from '../config/arboles';
import { CATEGORIAS, ESFERAS } from '../config/categorias';
import { ECONOMIA } from '../config/economia';
import { validarConfig } from '../config/esquemas';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  }),
});

async function main() {
  const problemas = validarConfig();
  if (problemas.length > 0) {
    console.error('El config tiene problemas y no se va a sembrar nada:\n');
    for (const p of problemas) console.error(`  - ${p}`);
    process.exit(1);
  }

  await prisma.profile.upsert({
    where: { id: 'me' },
    update: {},
    create: { id: 'me', horaCorteDia: ECONOMIA.horaCorteDia },
  });

  // ── Categorias ──────────────────────────────────────────────────────────
  for (const cat of CATEGORIAS) {
    const datos = {
      nombre: cat.nombre,
      esfera: cat.esfera,
      icono: cat.icono,
      color: ESFERAS[cat.esfera].color,
      orden: cat.orden,
      activa: cat.activa,
      topeDiarioMin: cat.topeDiarioMin ?? ECONOMIA.topeDiarioMinPorDefecto,
    };
    await prisma.category.upsert({
      where: { key: cat.key },
      update: datos,
      create: { key: cat.key, ...datos },
    });
  }

  // ── Ramas y nodos ───────────────────────────────────────────────────────
  for (const arbol of ARBOLES) {
    const categoria = await prisma.category.findUniqueOrThrow({
      where: { key: arbol.categoria },
    });

    for (const rama of arbol.ramas) {
      const datosRama = {
        categoryId: categoria.id,
        nombre: rama.nombre,
        descripcion: rama.descripcion ?? null,
        orden: rama.orden,
      };
      const ramaDb = await prisma.skillBranch.upsert({
        where: { key: rama.key },
        update: datosRama,
        create: { key: rama.key, ...datosRama },
      });

      for (const [indice, nodo] of rama.nodos.entries()) {
        const datosNodo = {
          branchId: ramaDb.id,
          nombre: nodo.nombre,
          descripcion: nodo.descripcion ?? null,
          tier: nodo.tier,
          maxLevel: nodo.maxLevel,
          costePuntos: nodo.costePuntos,
          esMaestria: nodo.esMaestria ?? false,
          retoDescripcion: nodo.retoDescripcion ?? null,
          orden: indice,
        };
        await prisma.skillNode.upsert({
          where: { key: nodo.key },
          update: datosNodo,
          create: { key: nodo.key, ...datosNodo },
        });
      }
    }
  }

  // Los requisitos van en una segunda pasada: todos los nodos tienen que
  // existir antes de poder enlazarlos.
  for (const arbol of ARBOLES) {
    for (const rama of arbol.ramas) {
      for (const nodo of rama.nodos) {
        const nodoDb = await prisma.skillNode.findUniqueOrThrow({ where: { key: nodo.key } });
        await prisma.nodeRequirement.deleteMany({ where: { nodeId: nodoDb.id } });
        for (const reqKey of nodo.requiere) {
          const req = await prisma.skillNode.findUniqueOrThrow({ where: { key: reqKey } });
          await prisma.nodeRequirement.create({
            data: { nodeId: nodoDb.id, requisitoId: req.id },
          });
        }
      }
    }
  }

  // ── Actividades ─────────────────────────────────────────────────────────
  for (const act of ACTIVIDADES) {
    const categoria = await prisma.category.findUniqueOrThrow({ where: { key: act.categoria } });
    const nodo = act.nodo
      ? await prisma.skillNode.findUniqueOrThrow({ where: { key: act.nodo } })
      : null;

    const datos = {
      categoryId: categoria.id,
      nodeId: nodo?.id ?? null,
      nombre: act.nombre,
      unidad: act.unidad,
      minutosPorUnidad: act.minutosPorUnidad,
      xpBasePorMinuto: act.xpBasePorMinuto ?? ECONOMIA.xpBasePorMinutoPorDefecto,
      tierEquivalente: act.tierEquivalente,
      activa: true,
      orden: act.orden,
    };
    await prisma.activity.upsert({
      where: { key: act.key },
      update: datos,
      create: { key: act.key, ...datos },
    });
  }

  // ── Rachas (global + una por categoria registrable) ─────────────────────
  const mesActual = new Date().toISOString().slice(0, 7);
  const claves: { clave: string; categoryId: string | null }[] = [
    { clave: 'global', categoryId: null },
  ];
  for (const cat of CATEGORIAS.filter((c) => c.activa)) {
    const categoria = await prisma.category.findUniqueOrThrow({ where: { key: cat.key } });
    claves.push({ clave: `cat:${cat.key}`, categoryId: categoria.id });
  }
  for (const { clave, categoryId } of claves) {
    await prisma.streak.upsert({
      where: { profileId_clave: { profileId: 'me', clave } },
      update: {},
      create: {
        clave,
        categoryId,
        congeladoresMes: mesActual,
        congeladoresRestantes: ECONOMIA.congeladoresPorMes,
      },
    });
  }

  const [categorias, ramas, nodos, actividades] = await Promise.all([
    prisma.category.count(),
    prisma.skillBranch.count(),
    prisma.skillNode.count(),
    prisma.activity.count(),
  ]);
  console.log(
    `Seed listo: ${categorias} categorias, ${ramas} ramas, ${nodos} nodos, ${actividades} actividades.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
