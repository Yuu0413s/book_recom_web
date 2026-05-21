import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    proxy: {
      // 開発時: /api/* を Workers dev server に転送
      '/api': 'http://localhost:8787',
    },
  },
});