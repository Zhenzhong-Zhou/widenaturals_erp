import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),

    // Enable Brotli compression in production
    mode === 'production' &&
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        deleteOriginFile: false, // Set to true only if you want to keep only compressed files
        verbose: true,
      }),

    // Bundle analyzer only in development
    mode === 'development' &&
      visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean), // filter out false plugins

  resolve: {
    alias: {
      '@styles': resolve(__dirname, './src/styles'),
      '@context': resolve(__dirname, './src/context'),
      '@components': resolve(__dirname, './src/components'),
      '@core': resolve(__dirname, './src/core'),
      '@utils': resolve(__dirname, './src/utils'),
      '@pages': resolve(__dirname, './src/pages'),
      '@routes': resolve(__dirname, './src/routes'),
      '@services': resolve(__dirname, './src/services'),
      '@features': resolve(__dirname, './src/features'),
      '@store': resolve(__dirname, './src/store'),
      '@assets': resolve(__dirname, './src/assets'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@layouts': resolve(__dirname, './src/layouts'),
      '@middleware': resolve(__dirname, './src/middleware'),
      '@constants': resolve(__dirname, './src/constants'),
      '@redux': resolve(__dirname, './src/redux'),
      '@themes': resolve(__dirname, './src/themes'),
      '@lib': resolve(__dirname, './src/lib'),
      '@config': resolve(__dirname, './src/config'),
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'date-fns',
      'lodash',
      'axios',
    ],
    exclude: [], // Can add libraries to skip pre-bundling if needed
  },

  build: {
    target: 'esnext',
    sourcemap: mode === 'development',
    minify: 'esbuild', // fastest and default

    chunkSizeWarningLimit: 700, // KB

    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        preset: 'smallest',
      },

      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/material')) return 'mui-core';
            if (id.includes('@mui/icons-material')) return 'mui-icons';
            if (id.includes('@mui/x-date-pickers')) return 'mui-datepickers';
            if (id.includes('date-fns')) return 'date-fns-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            if (id.includes('axios')) return 'axios-vendor';
            return 'vendor';
          }

          if (id.includes('src/components/')) return 'components';
        },
      },
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },

  preview: {
    port: 4173,
    strictPort: true,
  },
}));
