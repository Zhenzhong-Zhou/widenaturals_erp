import type { FC } from 'react';
import Box from '@mui/material/Box';
import { AppRoutes } from '@routes/index';

/**
 * AppContent
 *
 * Pure application shell.
 *
 * Responsibilities:
 * - Render the route tree
 * - Own layout positioning
 *
 * MUST NOT:
 * - Block rendering
 * - Perform initialization
 * - Show global loaders
 */
const AppContent: FC = () => {
  return (
    <Box
      className="app"
      sx={{
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      <AppRoutes />
    </Box>
  );
};

export default AppContent;
