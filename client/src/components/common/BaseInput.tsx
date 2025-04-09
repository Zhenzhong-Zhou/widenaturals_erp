import { FC } from 'react';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';
import { useThemeContext } from '@context/ThemeContext';

const BaseInput: FC<TextFieldProps> = ({ sx, slotProps, ...props }) => {
  const { theme } = useThemeContext();

  return (
    <TextField
      {...props}
      slotProps={{
        ...slotProps, // Spread and allow overriding slotProps
      }}
      sx={{
        marginBottom: theme.spacing(2), // Default spacing
        '& .MuiInputBase-root': {
          backgroundColor: theme.palette.background.paper, // Input background
          borderRadius: theme.shape.borderRadius, // Rounded corners
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.divider, // Default border color
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.palette.primary.main, // Hover border color
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
          {
            borderColor: theme.palette.primary.main, // Focus border color
            boxShadow: `0 0 0 3px ${theme.palette.primary.light}`, // Focus outline
          },
        '& .MuiFormHelperText-root': {
          color: theme.palette.error.main, // Error text color
        },
        ...sx, // Allow additional styles to override defaults
      }}
    />
  );
};

export default BaseInput;
