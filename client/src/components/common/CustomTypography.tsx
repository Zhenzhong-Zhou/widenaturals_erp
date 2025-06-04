import type { FC } from 'react';
import MuiTypography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';

interface CustomTypographyProps extends TypographyProps {
  variant?: TypographyProps['variant'];
  color?: TypographyProps['color'];
  align?: TypographyProps['align'];
}

const CustomTypography: FC<CustomTypographyProps> = ({
  children,
  variant = 'body1',
  color = 'textPrimary',
  align = 'inherit',
  ...props
}) => {
  return (
    <MuiTypography
      component={variant?.startsWith('h') ? variant : 'p'}
      variant={variant}
      color={color}
      align={align}
      {...props}
      sx={{
        marginBottom: '8px',
        fontFamily: "'Roboto', sans-serif",
        fontWeight: variant?.startsWith('h') ? 700 : 400,
        fontSize: variant === 'h5' ? '1.5rem' : undefined, // static for faster paint
        color: 'var(--text-primary)', // Use CSS variable
        minHeight: variant?.startsWith('h') ? '32px' : '24px', // avoid CLS
        textRendering: 'optimizeLegibility',
        ...props.sx,
      }}
    >
      {children}
    </MuiTypography>
  );
};

export default CustomTypography;
