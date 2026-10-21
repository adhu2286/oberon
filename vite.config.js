import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Local development middleware for API routes (/api/*).
 * Uses dynamic imports and `apply: 'serve'` so it runs ONLY in the local dev server
 * and is NEVER loaded or evaluated during `vite build` (preventing build errors on Vercel).
 */
function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    apply: 'serve', // Runs only during 'vite' dev, completely omitted from 'vite build'
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api')) {
          return next();
        }

        try {
          if (req.url.startsWith('/api/auth')) {
            const { default: authHandler } = await import('./api/auth.js');
            await authHandler(req, res);
          } else if (req.url.startsWith('/api/projects')) {
            const { default: projectsHandler } = await import('./api/projects.js');
            await projectsHandler(req, res);
          } else if (req.url.startsWith('/api/upload')) {
            const { default: uploadHandler } = await import('./api/upload.js');
            await uploadHandler(req, res);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
          }
        } catch (err) {
          console.error('Dev API Server error:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '/src': path.resolve(__dirname, './src'),
    },
  },
})
