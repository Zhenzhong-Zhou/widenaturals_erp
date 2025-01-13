import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@styles': resolve(__dirname, './src/styles'),
      '@context': resolve(__dirname, './src/context'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@pages': resolve(__dirname, './src/pages'),
      '@routes': resolve(__dirname, './src/routes'),
      '@services': resolve(__dirname, './src/services'),
      '@features': resolve(__dirname, './src/features'),
      '@store': resolve(__dirname, './src/store'),
    },
  },
});
