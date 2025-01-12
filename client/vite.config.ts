import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@styles': resolve(__dirname, './src/styles'), // Map @styles to src/styles
      '@context': resolve(__dirname, './src/context'),
    },
  },
});
