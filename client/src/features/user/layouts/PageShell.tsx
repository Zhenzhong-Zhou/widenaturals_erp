import { type FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography.tsx';

interface PageShellProps {
  /** Page title displayed in the header */
  title: string;

  /** Optional action elements (buttons, menus, filters) rendered in the header */
  actions?: ReactNode;

  /** Main page content */
  children: ReactNode;
}

/**
 * Standard page layout wrapper used across feature modules.
 *
 * Responsibilities:
 * - Provides a consistent page header with title and optional actions
 * - Applies uniform horizontal and vertical padding
 * - Visually separates the header from the main content
 *
 * Design notes:
 * - This component is **purely presentational**
 * - It contains no routing, data fetching, or business logic
 * - Intended to be composed with feature-specific layouts
 *   (tables, card grids, forms, etc.)
 *
 * Usage:
 * - List pages (tables, card views)
 * - Detail pages
 * - Dashboard-style feature modules
 */
const PageShell: FC<PageShellProps> = ({ title, actions, children }) => {
  return (
    <Box sx={{ px: 4, py: 3 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={3}
        gap={2}
      >
        <CustomTypography variant="h5" fontWeight={700}>
          {title}
        </CustomTypography>

        {actions}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {children}
    </Box>
  );
};

export default PageShell;
