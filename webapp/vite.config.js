import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.ELECTRON_BUILD === 'true' ? './' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '')
          || 'https://vercel-proxy-five-sage.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  }
});
