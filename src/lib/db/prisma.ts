import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma 7 se conecta con un driver adapter, no con la url del schema.
 * La ruta es relativa a la raiz del proyecto, igual que en prisma.config.ts.
 */
export const URL_BASE_DATOS = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

// En desarrollo Next recarga los modulos en caliente; sin este singleton se
// abririan decenas de conexiones a SQLite hasta que revienta.
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: URL_BASE_DATOS }) });

if (process.env.NODE_ENV !== 'production') globalParaPrisma.prisma = prisma;

/** Perfil unico. El dia que haya cuentas, esto pasa a venir de la sesion. */
export const PERFIL = 'me';
