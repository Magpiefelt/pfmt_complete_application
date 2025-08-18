import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import vueDevTools from 'vite-plugin-vue-devtools'
// import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // vueDevTools(),
    // tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    cors: true,
    hmr: {
      host: 'localhost'
    },
    // Proxy API calls to backend service
    // Use BACKEND_PORT env variable if provided, default to 3002
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || '3002'}`,
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
