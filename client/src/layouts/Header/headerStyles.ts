import { SxProps, Theme } from '@mui/material/styles';

export const headerStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  height: '81px',
  backgroundColor: theme.palette.background.default, // Dynamic background color
  color: theme.palette.text.primary, // Dynamic text color
  padding: theme.spacing(2),
  flexDirection: 'row',
  borderBottom: `1px solid ${theme.palette.divider}`, // Add a subtle divider for separation
  boxShadow: theme.shadows[2], // Add a slight shadow for a modern look
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    textAlign: 'center',
    height: 'auto', // Adjust height for stacking
    padding: theme.spacing(1.5),
  },
});

export const userInfoStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2), // Add spacing between elements
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    textAlign: 'center',
    gap: theme.spacing(1), // Adjust spacing for smaller screens
  },
});

export const typographyStyles = (theme: Theme): SxProps<Theme> => ({
  marginRight: theme.spacing(2),
  fontWeight: 500, // Add slight boldness for better readability
  color: theme.palette.text.primary, // Ensure dynamic text color
  [theme.breakpoints.down('sm')]: {
    marginRight: 0, // Remove margin on smaller screens
    marginBottom: theme.spacing(1), // Add bottom margin instead
  },
});

export const serverStatusStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(1),
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200], // Dynamic background based on theme mode
  borderRadius: theme.shape.borderRadius, // Rounded corners
  color: theme.palette.text.secondary,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(1), // Add bottom margin for smaller screens
  },
});
