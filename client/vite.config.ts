import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'brotliCompress', ext: '.br' }), // Enable Brotli compression
    process.env.NODE_ENV === 'development' ? visualizer({ filename: 'dist/stats.html' }) : null, // Only use visualizer in development
  ],
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
      '@assets': resolve(__dirname, './src/assets'),  // Images, icons, fonts, static files
      '@hooks': resolve(__dirname, './src/hooks'),  // Custom React hooks
      '@layouts': resolve(__dirname, './src/layouts'),  // Layout components
      '@middleware': resolve(__dirname, './src/middleware'),  // Middleware functions
      '@constants': resolve(__dirname, './src/constants'),  // Constants and enums
      '@redux': resolve(__dirname, './src/redux'),  // Redux-related logic
      '@themes': resolve(__dirname, './src/themes'),  // Theme configuration for MUI or styled-components
      '@lib': resolve(__dirname, './src/lib'),  // Utility libraries, API clients, etc.
      '@config': resolve(__dirname, './src/config'),  // App-wide configuration files
    },
  },
  
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      'date-fns',
      'axios',
      'lodash',
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
  },
  
  build: {
    target: 'esnext',
    sourcemap: process.env.NODE_ENV === 'development', // Allow sourcemaps in dev, disable in prod
    minify: 'esbuild',
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false, // Remove unused modules
        preset: 'smallest', // Ensures aggressive tree-shaking
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/material')) return 'mui-core'; // Separate MUI Core
            if (id.includes('@mui/icons-material')) return 'mui-icons'; // Separate MUI Icons
            if (id.includes('@mui/x-date-pickers')) return 'mui-datepickers'; // Separate MUI Date Pickers
            if (id.includes('date-fns')) return 'date-fns-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            if (id.includes('axios')) return 'axios-vendor';
            
            return 'vendor'; // Default chunk for remaining dependencies
          }
          if (id.includes('src/components/')) {
            return 'components'; // Split components into their own chunk
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunks exceed 500KB
  },
});
