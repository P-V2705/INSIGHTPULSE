import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev, proxy /api → local backend (or VITE_API_URL if set).
  // In production (Netlify): netlify.toml proxy handles /api/* — no URL in JS bundle.
  const apiTarget = env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Connection', 'keep-alive')
            })
          },
        },
      },
    },

    preview: { port: 3000 },

    build: {
      outDir: 'dist',
      sourcemap: false,       // disabled in production — smaller bundle, no source exposure
      minify: 'esbuild',      // fastest + smallest; esbuild is Vite's default
      target: 'es2020',       // all modern browsers supported by Netlify CDN

      rollupOptions: {
        output: {
          // ── Vendor code splitting ──────────────────────────────────────
          // Splits vendor libs into separate chunks so browsers can cache them
          // independently from app code. Netlify's CDN serves them with
          // immutable Cache-Control (set in netlify.toml / _headers).
          manualChunks: {
            react:  ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            ui:     ['framer-motion', 'lucide-react'],
          },
          // Content-hash filenames → safe for max-age=31536000, immutable
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },

      chunkSizeWarningLimit: 800,
    },
  }
})
