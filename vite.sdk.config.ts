import { defineConfig } from 'vite'
import path from 'node:path'

/**
 * Vite config for the `@liraintelligence/support` package.
 *
 * The package exposes a headless client and React adapters while the heavy
 * support UI still ships from the CDN widget bundle. That keeps the NPM package
 * small and gives us a clean boundary for the future runtime extraction.
 */
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, 'packages/lira-support/src/index.ts'),
        react: path.resolve(__dirname, 'packages/lira-support/src/react.tsx'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    outDir: 'dist/sdk',
    emptyOutDir: false,
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react/jsx-runtime'],
      output: {
        exports: 'named',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
