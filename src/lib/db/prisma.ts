import { createRequire } from 'node:module';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 7 se conecta con un driver adapter, no con la url del schema. Aqui
 * se elige cual segun donde este corriendo la app:
 *
 *   · en tu ordenador, SQLite en un archivo (prisma/dev.db)
 *   · desplegada, SQLite alojado (Turso), que habla el MISMO dialecto
 *
 * Por eso el esquema no cambia ni una linea al desplegar: es el mismo SQLite
 * a los dos lados. Si algun dia hiciera falta PostgreSQL, tocaria cambiar el
 * provider del schema; con esto no.
 */
export const URL_BASE_DATOS = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

const urlRemota = process.env.TURSO_DATABASE_URL;

function crearCliente(): PrismaClient {
  if (urlRemota) {
    // Se carga solo cuando de verdad hay base remota. libsql trae un binario
    // nativo por plataforma y no existe para todas: importarlo siempre
    // rompia el build en Windows por una dependencia que ahi no se usa.
    const cargar = createRequire(import.meta.url);
    const { PrismaLibSql } = cargar('@prisma/adapter-libsql') as {
      PrismaLibSql: new (config: { url: string; authToken?: string }) => never;
    };
    return new PrismaClient({
      adapter: new PrismaLibSql({ url: urlRemota, authToken: process.env.TURSO_AUTH_TOKEN }),
    });
  }
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: URL_BASE_DATOS }) });
}

// En desarrollo Next recarga los modulos en caliente; sin este singleton se
// abririan decenas de conexiones a SQLite hasta que revienta.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalParaPrisma.prisma ?? crearCliente();

if (process.env.NODE_ENV !== 'production') globalParaPrisma.prisma = prisma;

/** Perfil unico. El dia que haya cuentas, esto pasa a venir de la sesion. */
export const PERFIL = 'me';
