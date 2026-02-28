import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 開発時: /api/* を Workers dev server に転送
      '/api': 'http://localhost:8787',
    },
  },
});
