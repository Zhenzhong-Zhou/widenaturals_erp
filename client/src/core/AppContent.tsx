import type { FC } from 'react';
import Box from '@mui/material/Box';
import { AppRoutes } from '@routes/index';
import { useUserSelfProfileAuto } from '@hooks/index';

/**
 * AppContent
 *
 * Core application content container.
 *
 * Responsibilities:
 * - Render the route tree
 * - Own layout positioning
 * - Trigger non-blocking, post-render side effects
 *   (e.g. user identity hydration)
 *
 * MUST NOT:
 * - Block initial rendering
 * - Gate UI on authentication or permissions
 * - Show global loaders
 */
const AppContent: FC = () => {
  useUserSelfProfileAuto();

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
