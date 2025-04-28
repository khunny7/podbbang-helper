import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/proxy': {  // <--- fix here
        target: 'http://localhost:3080',
        changeOrigin: true,
        rewrite: (path) => path  // don't strip /proxy
      }
    }
  }
});