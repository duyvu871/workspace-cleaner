import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  target: 'node16',
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
});
