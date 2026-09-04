import { defineConfig } from '@prisma/config';

/**
 * Prisma 7 saco la URL de conexion del schema. Aqui vive la de las
 * herramientas (migrate, db push, studio); el cliente en tiempo de ejecucion
 * se conecta aparte, con el driver adapter de src/lib/db/prisma.ts.
 *
 * La ruta es relativa a la raiz del proyecto, que es desde donde se lanzan
 * los comandos de npm.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
