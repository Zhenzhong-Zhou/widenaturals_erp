import { Box, Typography, Divider } from '@mui/material';
import { ThemeSettingsPanel } from '@features/settings/components';

/**
 * SettingsPage
 *
 * Top-level settings page for user-configurable preferences.
 *
 * Responsibilities:
 * - Provide a dedicated, accessible location for application settings
 * - Act as a layout container for individual settings sections
 *
 * Current scope:
 * - Appearance / Theme configuration
 *
 * Architectural notes:
 * - This page intentionally avoids dialogs to simplify focus management
 * - Settings logic is delegated to domain-specific panels
 * - Designed to scale into multiple sections or sub-routes in the future
 */
const SettingsPage = () => {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <ThemeSettingsPanel />
    </Box>
  );
};

export default SettingsPage;
