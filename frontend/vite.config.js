import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // In dev, proxy /api → local backend (or VITE_API_URL if set)
  // In production (Cloudflare Pages), _redirects handles /api/* proxying — no bundled URL.
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
      sourcemap: false,        // disable in production for security + smaller bundle
      minify: 'esbuild',       // fastest minifier; terser not needed at this scale
      target: 'es2020',        // modern browsers — Cloudflare CDN handles legacy users

      // ── Code splitting ────────────────────────────────────────────────────
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk: React core
            react: ['react', 'react-dom', 'react-router-dom'],
            // Charts chunk: heavy, rarely changes
            charts: ['recharts'],
            // Animation/UI
            ui: ['framer-motion', 'lucide-react'],
          },
          // Content-hash filenames for Cloudflare CDN long-term caching
          chunkFileNames:  'assets/[name]-[hash].js',
          entryFileNames:  'assets/[name]-[hash].js',
          assetFileNames:  'assets/[name]-[hash][extname]',
        },
      },

      // Warn if any single chunk exceeds 800 KB (budgeting)
      chunkSizeWarningLimit: 800,
    },
  }
})
