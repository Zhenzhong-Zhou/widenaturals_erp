import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

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
      // MUI Core Components (Avoids full @mui/material import)
      '@mui/material/Autocomplete',
      '@mui/material/Avatar',
      '@mui/material/Box',
      '@mui/material/Button',
      '@mui/material/Card',
      '@mui/material/CardActions',
      '@mui/material/CardContent',
      '@mui/material/CardMedia',
      '@mui/material/Checkbox',
      '@mui/material/CssBaseline',
      '@mui/material/Dialog',
      '@mui/material/DialogActions',
      '@mui/material/DialogContent',
      '@mui/material/DialogTitle',
      '@mui/material/FormControl',
      '@mui/material/FormControlLabel',
      '@mui/material/FormHelperText',
      '@mui/material/IconButton',
      '@mui/material/InputLabel',
      '@mui/material/MenuItem',
      '@mui/material/Modal',
      '@mui/material/Pagination',
      '@mui/material/Paper',
      '@mui/material/Popover',
      '@mui/material/Select',
      '@mui/material/styles/ThemeProvider',
      '@mui/material/Table',
      '@mui/material/TableBody',
      '@mui/material/TableCell',
      '@mui/material/TableContainer',
      '@mui/material/TableHead',
      '@mui/material/TablePagination',
      '@mui/material/TableRow',
      '@mui/material/TableSortLabel',
      '@mui/material/TextField',
      '@mui/material/Tooltip',
      '@mui/material/Typography',
      
      // MUI Icons (Avoids full @mui/icons-material import)
      '@mui/icons-material/Add',
      '@mui/icons-material/Close',
      '@mui/icons-material/Delete',
      
      // FontAwesome Icons
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons/faEye',
      '@fortawesome/free-solid-svg-icons/faEyeSlash',
      
      // MUI Date Pickers
      '@mui/x-date-pickers',
      
      // Date Handling (Avoids full date-fns import)
      'date-fns/format',
      
      // Lodash Optimization (Avoids full lodash import)
      'lodash/debounce',
      'lodash/throttle',
      
      // Other Dependencies
      'axios',
    ],
  },
  
  build: {
    sourcemap: process.env.NODE_ENV === 'development', // Disable source maps in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('@mui')) return 'mui-vendor';
            if (id.includes('date-fns')) return 'date-fns-vendor';
            if (id.includes('axios')) return 'axios-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            return 'vendor'; // Default chunk for other node_modules
          }
        },
      },
      plugins: [
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
    },
    chunkSizeWarningLimit: 500, // Warn if chunks exceed 500KB
  },
});
