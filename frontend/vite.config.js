import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En développement, Vite redirige /api et /storage vers le backend Laravel
// (par défaut le Nginx de Docker sur le port 8190).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8190'

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': { target, changeOrigin: true },
        '/storage': { target, changeOrigin: true },
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
    },
  }
})
