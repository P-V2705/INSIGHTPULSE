import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev: proxy /api → local backend via VITE_API_URL (or localhost:8000 fallback).
  // Production (Netlify): netlify.toml proxy rule handles /api/* — no URL baked in.
  const apiTarget = env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
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
      sourcemap: false,       // disabled — smaller bundle, no source exposure in prod
      minify: 'esbuild',      // fastest + smallest
      target: 'es2020',       // all modern browsers supported by Netlify CDN

      rollupOptions: {
        output: {
          // ── Code splitting — separate vendor chunks for long-term CDN caching ──
          manualChunks: {
            react:  ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            ui:     ['framer-motion', 'lucide-react'],
          },
          // Content-hashed filenames → safe for 1-year immutable Cache-Control
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },

      chunkSizeWarningLimit: 800,
    },
  }
})
