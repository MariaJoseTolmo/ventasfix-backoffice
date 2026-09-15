import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Network decision: the front NEVER crosses origin (see docs/04-CONTRATO-API.md
// and root docker-compose files). In delivery, Nginx serves the build on :80
// and proxies /api and /uploads to the api container — the browser only ever
// talks to its own origin. In dev we replicate that with Vite's dev proxy so
// relative fetches ("/api/...") behave identically in both modes and
// CORS_ORIGINS on the backend never needs a second origin added to it.
// VITE_API_PROXY_TARGET lets this run outside Docker (default: localhost:3000)
// or inside the `web` compose service (set to http://api:3000).
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
      '/uploads': { target: apiProxyTarget, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: true,
  },
});
