import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Las dependencias quedan externas: se instalan con npm en el servidor.
  skipNodeModulesBundle: true,
})
