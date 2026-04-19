import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Vite config for the Lira Support Portal — standalone SPA.
 *
 * Build:   npx vite build --config vite.portal.config.ts
 * Output:  dist/portal/
 * Dev:     npx vite --config vite.portal.config.ts
 *
 * Deploy:  aws s3 sync dist/portal/ s3://lira-portal-cdn/ \
 *            --cache-control "public, max-age=3600" --delete
 *          aws cloudfront create-invalidation \
 *            --distribution-id <PORTAL_CF_DIST_ID> --paths "/*"
 */
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist/portal',
    emptyOutDir: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'portal.html'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    open: '/portal.html',
  },
})
