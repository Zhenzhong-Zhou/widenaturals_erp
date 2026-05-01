import type { FC } from 'react';
import { AppBar, Toolbar, Box, Stack, useTheme } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';
import { NavLink } from '@pages/home/components/index';
import logoLight from '@assets/wide-logo-light.png';
import logoDark from '@assets/wide-logo-dark.png';

export interface HeaderProps {
  onStaffLogin?: () => void;
}

const Header: FC<HeaderProps> = ({ onStaffLogin }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.appBar,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{
          maxWidth: 1120,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          minHeight: 72,
          py: 1,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* Brand */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Logo */}
          <Box
            component="a"
            href="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src={isDark ? logoDark : logoLight}
              alt="WIDE Naturals Inc."
              loading="eager"
              style={{ height: 44, objectFit: 'contain', display: 'block' }}
            />
          </Box>

          {/* Text block */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: 44, // matches logo height for clean centering
            }}
          >
            <CustomTypography
              variant="h6"
              fontWeight={700}
              sx={{
                color: 'text.primary',
                m: 0,
              }}
            >
              WIDE Naturals
            </CustomTypography>
            <CustomTypography
              variant="caption"
              sx={{
                color: 'text.secondary',
                whiteSpace: 'nowrap',
                m: 0,
                mt: 0.25,
              }}
            >
              Natural Health Products • Canadian cGMP • Global Distribution
            </CustomTypography>
          </Box>
        </Stack>

        {/* Navigation */}
        <Stack
          direction="row"
          spacing={3}
          alignItems="center"
          sx={{
            display: { xs: 'none', md: 'flex' },
          }}
        >
          <NavLink href="#about">About</NavLink>
          <NavLink href="#capabilities">Capabilities</NavLink>
          <NavLink href="#brands">Brands</NavLink>
          <NavLink href="#contact">Contact</NavLink>

          {onStaffLogin ? (
            <CustomButton
              variant="contained"
              color="primary"
              size="small"
              onClick={onStaffLogin}
              sx={{
                ml: 1,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Staff Login
            </CustomButton>
          ) : null}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
