import type { SxProps, Theme } from '@mui/material/styles';

export const sidebarStyles = (
  theme: Theme,
  isOpen: boolean
): SxProps<Theme> => ({
  width: isOpen ? '240px' : '80px',
  flexShrink: 0,

  '& .MuiDrawer-paper': {
    width: isOpen ? '240px' : '80px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
    boxShadow: isOpen ? '2px 0 5px rgba(0,0,0,0.1)' : 'none',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
  },

  [theme.breakpoints.down('md')]: {
    '& .MuiDrawer-paper': {
      width: isOpen ? '240px' : '0px',
      position: 'fixed',
      zIndex: 1300,
    },
  },

  [theme.breakpoints.down('sm')]: {
    '& .MuiDrawer-paper': {
      width: isOpen ? '100%' : '0px',
      height: '100%',
      position: 'fixed',
      zIndex: 1400,
    },
  },
});
