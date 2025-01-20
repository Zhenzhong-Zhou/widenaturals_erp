import { FC } from 'react';
import Button, { ButtonProps } from '@mui/material/Button';
import { useThemeContext } from '../../context/ThemeContext.tsx';

interface CustomButtonProps extends ButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

const CustomButton: FC<CustomButtonProps> = ({
  children,
  variant = 'contained', // Default to 'contained' for primary actions
  color = 'primary', // Default to primary color
  size = 'medium', // Default size
  ...props
}) => {
  const { theme } = useThemeContext();

  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      {...props}
      sx={{
        textTransform: 'none', // Disable uppercase text for consistency
        borderRadius: theme.shape.borderRadius, // Use theme's border radius
        padding: theme.spacing(1, 2), // Consistent padding
        boxShadow: variant === 'contained' ? theme.shadows[2] : 'none', // Add subtle shadow for contained buttons
        '&:hover': {
          boxShadow: variant === 'contained' ? theme.shadows[4] : 'none', // Enhanced shadow on hover
        },
        ...props.sx, // Allow custom styles to override defaults
      }}
    >
      {children}
    </Button>
  );
};

export default CustomButton;
