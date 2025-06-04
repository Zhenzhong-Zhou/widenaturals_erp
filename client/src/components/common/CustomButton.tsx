import type { FC, ReactNode } from 'react';
import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { useThemeContext } from '@context/ThemeContext';
import Loading from '@components/common/Loading';
import Box from '@mui/material/Box';

interface CustomButtonProps extends ButtonProps {
  to?: string; // Optional 'to' prop for routing
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
  icon?: ReactNode;
  loading?: boolean;
}

const CustomButton: FC<CustomButtonProps> = ({
                                               children,
                                               to,
                                               variant = 'contained',
                                               color = 'primary',
                                               size = 'medium',
                                               icon,
                                               loading,
                                               ...props
                                             }) => {
  const { theme } = useThemeContext();
  
  const borderRadius = theme.shape?.borderRadius ?? 6; // fallback if isn't defined
  const spacing = theme.spacing?.(1, 2) ?? '8px 16px';
  
  return (
    <Button
      component={to ? RouterLink : 'button'}
      to={to}
      variant={variant}
      color={color}
      size={size}
      startIcon={icon}
      {...props}
      sx={{
        textTransform: 'none',
        borderRadius,
        padding: spacing,
        fontWeight: 500,
        fontFamily: "'Roboto', sans-serif",
        boxShadow: variant === 'contained' ? theme.shadows?.[2] ?? 'none' : 'none',
        '&:hover': {
          boxShadow: variant === 'contained' ? theme.shadows?.[4] ?? 'none' : 'none',
        },
        ...props.sx,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 80 }}>
        {loading ? (
          <Loading size={20} variant="spinner" />
        ) : (
          children
        )}
      </Box>
    </Button>
  );
};

export default CustomButton;
