import { defineConfig } from '@prisma/config';

/**
 * Prisma 7 saco la URL de conexion del schema. Aqui vive la de las
 * herramientas (migrate, db push, studio); el cliente en tiempo de ejecucion
 * se conecta aparte, con el driver adapter de src/lib/db/prisma.ts.
 *
 * La ruta es relativa a la raiz del proyecto, que es desde donde se lanzan
 * los comandos de npm.
 *
 * Mismo criterio que en tiempo de ejecucion: si hay TURSO_DATABASE_URL, las
 * herramientas apuntan ahi (el token va como query param porque aqui solo
 * hay sitio para una url, no para un objeto de configuracion aparte).
 */
const urlTurso = process.env.TURSO_DATABASE_URL
  ? `${process.env.TURSO_DATABASE_URL}?authToken=${process.env.TURSO_AUTH_TOKEN ?? ''}`
  : undefined;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: urlTurso ?? process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
