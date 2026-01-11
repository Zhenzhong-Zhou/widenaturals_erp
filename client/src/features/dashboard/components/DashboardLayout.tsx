import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Skeleton } from '@mui/material';
import CustomTypography from '@components/common/CustomTypography';

interface DashboardLayoutProps {
  fullName?: string;
  title?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}

/**
 * DashboardLayout
 *
 * Generic layout wrapper for dashboard-style pages.
 *
 * Responsibilities:
 * - Provide consistent page padding and vertical spacing
 * - Render a lightweight greeting header when user identity is available
 * - Reserve space for optional summary or header content
 * - Serve as a stable container for dashboard page content
 *
 * Behavior:
 * - Renders a skeleton placeholder while `fullName` is unresolved
 * - Does not block rendering or perform any data fetching
 *
 * MUST NOT:
 * - Perform permission checks
 * - Fetch user or session data
 * - Control routing or navigation
 *
 * Design notes:
 * - Permission-based visibility should be handled by parent components
 * - Header content is injected declaratively via the `header` prop
 * - Intended to be composable across different dashboard roles
 */
const DashboardLayout: FC<DashboardLayoutProps> = ({
                                                     fullName,
                                                     header,
                                                     children,
                                                   }) => {
  return (
    <Box sx={{ padding: 3 }}>
      {/* Greeting */}
      {fullName ? (
        <CustomTypography
          variant="body1"
          component="h1"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 500,
            minHeight: '1.5rem',
          }}
        >
          Welcome,&nbsp;
          <Box
            component="span"
            sx={{ color: 'primary.main', fontWeight: 600 }}
          >
            {fullName}
          </Box>
          !
        </CustomTypography>
      ) : (
        <Skeleton variant="text" width={200} />
      )}
      
      {/* Optional header / summary section */}
      {header && <Box sx={{ mt: 2 }}>{header}</Box>}
      
      {/* Main content */}
      <Box sx={{ mt: 3 }}>{children}</Box>
    </Box>
  );
};

export default DashboardLayout;
