import type { FC } from 'react';
import { useTheme } from '@mui/material';
import TextField from '@mui/material/TextField';
import type { TextFieldProps } from '@mui/material/TextField';

/**
 * BaseInput wraps MUI's TextField with default styling.
 * - Uses CSS variables for LCP-safe rendering and theme transitions
 * - Supports custom sx overrides and slotProps
 */
const BaseInput: FC<TextFieldProps> = ({ sx = {}, slotProps, ...props }) => {
  const theme = useTheme();
  
  return (
    <TextField
      {...props}
      slotProps={{ ...slotProps }}
      sx={{
        marginBottom: theme.spacing(2),
        '& .MuiInputBase-root': {
          backgroundColor: 'var(--bg-paper)',
          borderRadius: theme.shape.borderRadius,
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--border-light)',
        },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: 'var(--primary-color)',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
          {
            borderColor: 'var(--primary-color)',
            boxShadow: `0 0 0 3px ${theme.palette.primary.light}`, // Keep dynamic for clarity
          },
        '& .MuiFormHelperText-root': {
          color: 'var(--text-secondary)',
        },
        ...sx,
      }}
    />
  );
};

export default BaseInput;
