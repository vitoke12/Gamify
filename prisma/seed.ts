/**
 * Seed. Es un traductor: lee /config y lo vuelca en la base. No inventa
 * datos propios y es idempotente, asi que se puede volver a lanzar cada vez
 * que cambien las reglas del juego sin perder el historial del jugador.
 */
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';
import { ACTIVIDADES } from '../config/actividades';
import { ARBOLES } from '../config/arboles';
import { CATEGORIAS, ESFERAS } from '../config/categorias';
import { ECONOMIA } from '../config/economia';
import { LOGROS } from '../config/logros';
import { validarConfig } from '../config/esquemas';

// Mismo criterio que src/lib/db/prisma.ts: si hay TURSO_DATABASE_URL se
// siembra ahi (produccion); si no, en el archivo local. El adapter de
// better-sqlite3 se importa solo cuando hace falta, porque trae un binario
// nativo por plataforma que no siempre esta compilado.
const urlRemota = process.env.TURSO_DATABASE_URL;

async function crearCliente(): Promise<PrismaClient> {
  if (urlRemota) {
    const cargar = createRequire(import.meta.url);
    const { PrismaLibSql } = cargar('@prisma/adapter-libsql') as {
      PrismaLibSql: new (config: { url: string; authToken?: string }) => never;
    };
    return new PrismaClient({
      adapter: new PrismaLibSql({ url: urlRemota, authToken: process.env.TURSO_AUTH_TOKEN }),
    });
  }
  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
  return new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
    }),
  });
}

let prisma: PrismaClient;

async function main() {
  prisma = await crearCliente();

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

  // ── Logros ──────────────────────────────────────────────────────────────
  // La condicion vive en /config; aqui solo se guarda el catalogo para poder
  // enlazar los desbloqueos y pintarlos.
  for (const logro of LOGROS) {
    const datos = {
      nombre: logro.nombre,
      descripcion: logro.descripcion,
      esSecreto: logro.esSecreto,
      condicionKey: logro.key,
      orden: logro.orden,
    };
    await prisma.achievement.upsert({
      where: { key: logro.key },
      update: datos,
      create: { key: logro.key, ...datos },
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

  const [categorias, ramas, nodos, actividades, logros] = await Promise.all([
    prisma.category.count(),
    prisma.skillBranch.count(),
    prisma.skillNode.count(),
    prisma.activity.count(),
    prisma.achievement.count(),
  ]);
  console.log(
    `Seed listo: ${categorias} categorias, ${ramas} ramas, ${nodos} nodos, ${actividades} actividades, ${logros} logros.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
