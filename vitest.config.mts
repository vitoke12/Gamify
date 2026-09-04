import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Solo dominio. Las funciones de /lib/domain no tocan React ni Prisma, asi
 * que los tests corren en node puro y sin base de datos.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@config': fileURLToPath(new URL('./config', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
