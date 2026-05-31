import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:8000'

  return {
    plugins: [react()],
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
    // Expose the API URL to the built app so it can call the backend directly
    // when there is no dev-server proxy (i.e. on Netlify)
    define: {
      __API_BASE__: JSON.stringify(
        mode === 'production' ? (env.VITE_API_URL || '') : ''
      ),
    },
  }
})
