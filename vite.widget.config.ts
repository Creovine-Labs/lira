import { defineConfig } from 'vite'
import path from 'node:path'

/**
 * Vite config for the Lira Support Widget — builds to a single IIFE JS file.
 *
 * Build:   npx vite build --config vite.widget.config.ts
 * Output:  dist/widget/widget.js
 *
 * Deploy:  aws s3 cp dist/widget/widget.js s3://lira-widget-cdn/v1/widget.js \
 *            --content-type "application/javascript" --cache-control "public, max-age=3600"
 *          aws cloudfront create-invalidation --distribution-id EZMZM7JYD11HG --paths "/v1/*"
 */
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/support-widget/widget.ts'),
      name: 'LiraWidget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    outDir: 'dist/widget',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Single file — no code splitting
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
