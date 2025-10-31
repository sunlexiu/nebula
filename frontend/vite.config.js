// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.API_BASE_URL': JSON.stringify('/api'), // 开发模式使用 /api
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_BASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // 去掉 /api 前缀
      },
    },
  },
});