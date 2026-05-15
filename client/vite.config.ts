import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

/**
 * Vendor chunking map.
 *
 * Each key is the emitted chunk name; each value lists package names that
 * belong in it. A package matches when `/node_modules/{pkg}/` appears in the
 * module id (so `lodash-es` does not match `lodash`).
 *
 * Anything not listed falls through to Rollup's default chunking, which
 * produces smaller, route-scoped chunks via dynamic imports.
 */
const VENDOR_CHUNKS: Record<string, readonly string[]> = {
  // React runtime — present on every page, must be one chunk for hooks/context identity
  'react-core': ['react', 'react-dom', 'react/jsx-runtime', 'scheduler'],
  
  // Redux ecosystem — present on every page
  'redux-core': [
    '@reduxjs/toolkit',
    'react-redux',
    'redux-persist',
    'reselect',
    'immer',
  ],
  
  // Router
  router: ['react-router', 'react-router-dom', '@remix-run/router'],
  
  // MUI v9 core + Emotion runtime (must stay together)
  'mui-core': [
    '@mui/material',
    '@mui/system',
    '@mui/utils',
    '@mui/private-theming',
    '@mui/base',
    '@emotion/react',
    '@emotion/styled',
    '@emotion/cache',
    '@emotion/serialize',
    '@emotion/utils',
    '@emotion/hash',
    '@emotion/sheet',
    '@emotion/memoize',
  ],
  
  // MUI icons — kept separate so pages without icons skip it
  'mui-icons': ['@mui/icons-material'],
  
  // MUI X date pickers — only loaded on pages that use them
  'mui-datepickers': ['@mui/x-date-pickers', '@mui/x-internals'],
  
  // Forms
  forms: ['react-hook-form', '@hookform/resolvers'],
  
  // Date utils
  'date-utils': ['date-fns', 'dayjs'],
  
  // HTTP
  http: ['axios', 'axios-retry', 'qs'],
  
  // Lodash (forced to lodash-es via alias below for tree-shaking)
  lodash: ['lodash-es'],
};

const getVendorChunk = (id: string): string | undefined =>
  Object.entries(VENDOR_CHUNKS).find(([, libs]) =>
    libs.some((lib) => id.includes(`/node_modules/${lib}/`))
  )?.[0];

// UI primitives imported on virtually every page — kept in one long-lived chunk
const UI_PRIMITIVE_PATTERN =
  /\/components\/common\/(CustomButton|Typography|ErrorDisplay|ErrorMessage|Loading|BaseInput|Dropdown|DetailsSection)\//;

// Side-effect files that must NOT be tree-shaken (CSS imports, polyfills)
const SIDE_EFFECT_PATTERN = /\.(?:css|scss|sass|less)$|\/src\/polyfills/;

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const isAnalyze = mode === 'analyze';
  
  const plugins: PluginOption[] = [react()];
  
  if (isProd) {
    plugins.push(
      compression({
        algorithms: ['brotliCompress', 'gzip'],
        threshold: 1024,
        deleteOriginalAssets: false,
      })
    );
  }
  
  if (isAnalyze) {
    plugins.push(
      visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }) as PluginOption
    );
  }
  
  return {
    plugins,
    
    resolve: {
      alias: {
        '@emotion/react': resolve(__dirname, 'node_modules/@emotion/react'),
        '@emotion/styled': resolve(__dirname, 'node_modules/@emotion/styled'),
        
        // Force `import _ from 'lodash'` to resolve to the ESM build.
        // Requires: `npm un lodash @types/lodash && npm i lodash-es && npm i -D @types/lodash-es`
        lodash: resolve(__dirname, 'node_modules/lodash-es'),
        
        '@styles': resolve(__dirname, './src/styles'),
        '@shared-types': resolve(__dirname, './src/types'),
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
        'react-redux',
        '@reduxjs/toolkit',
        'react-router-dom',
        '@mui/material',
        '@mui/material/styles',
        '@mui/system',
        '@mui/icons-material',
        '@mui/x-date-pickers',
        '@mui/x-date-pickers/AdapterDateFns',
        '@emotion/react',
        '@emotion/styled',
        'date-fns',
        'lodash-es',
        'axios',
        'react-hook-form',
      ],
    },
    
    // No `esbuild` or `oxc` block needed for typical setups.
    // - JSX/TS transform: handled by @vitejs/plugin-react
    // - JS minification: Oxc Minifier (default in Vite 7.1+, faster than esbuild)
    // - CSS minification: Lightning CSS (default)
    //
    // For console.* stripping in prod, see the note at the bottom of this file.
    
    build: {
      target: 'esnext',
      sourcemap: isProd ? 'hidden' : true,
      cssMinify: true,
      cssCodeSplit: true,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 600,
      assetsInlineLimit: 4096,
      
      rollupOptions: {
        treeshake: {
          moduleSideEffects: (id: string) => SIDE_EFFECT_PATTERN.test(id),
        },
        
        output: {
          manualChunks(id: string): string | undefined {
            if (id.includes('/node_modules/')) {
              return getVendorChunk(id);
            }
            if (UI_PRIMITIVE_PATTERN.test(id)) {
              return 'ui-primitives';
            }
            return undefined;
          },
          
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
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
  };
});
