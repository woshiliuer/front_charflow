import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL ?? 'http://localhost:8080'
  const apiProxyPath = env.VITE_API_PROXY_PATH ?? '/api'

  return {
    plugins: [
      vue()
    ],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    server: {
      proxy: apiBaseUrl
        ? {
          [apiProxyPath]: {
            target: apiBaseUrl,
            changeOrigin: true,
            rewrite: (path) => {
              if (!path.startsWith(apiProxyPath)) return path
              const rewritten = path.slice(apiProxyPath.length)
              return rewritten.startsWith('/') ? rewritten : `/${rewritten}`
            },
          },
          // WebSocket 代理
          '/ws': {
            target: apiBaseUrl,
            ws: true,
            changeOrigin: true,
          },
        }
        : undefined,
    },
  }
})
