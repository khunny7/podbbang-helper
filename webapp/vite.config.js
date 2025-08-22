import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173
    // Note: Proxy configuration removed - webapp now uses Vercel serverless proxy
  }
});