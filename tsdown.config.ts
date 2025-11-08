import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['bin/create-astro-exe.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  dts: false, // No need for dts in CLI
  outExtension: () => ({ js: '.js' }),
})
