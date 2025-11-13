import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  // 如果你的后端本地跑在 8080 端口，保留这个代理；否则改成你的端口
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
//         rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
})
