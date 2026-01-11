import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';

interface AppShellProps {
  children: ReactNode;
}

/**
 * AppShell
 *
 * Pure visual application frame.
 *
 * Responsibilities:
 * - Provide a stable, immediately paintable layout shell
 * - Define top-level page geometry for layout composition
 * - Serve as the LCP anchor element
 *
 * MUST NOT:
 * - Read auth state
 * - Block rendering
 * - Perform side effects
 * - Know about routing or permissions
 */
const AppShell: FC<AppShellProps> = ({ children }) => {
  return (
    <Box
      id="app-shell"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: 0, // important for flex layouts
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default AppShell;
