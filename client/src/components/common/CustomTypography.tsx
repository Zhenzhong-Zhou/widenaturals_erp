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
  component,
  ...props
}) => {
  const defaultComponent = variant?.startsWith('h') ? (variant as any) : 'p';

  return (
    <MuiTypography
      component={component ?? defaultComponent}
      variant={variant}
      color={color}
      align={align}
      {...props}
      sx={{
        marginBottom: '8px',
        fontFamily: "'Roboto', sans-serif",
        fontWeight: variant?.startsWith('h') ? 700 : 400,
        fontSize: variant === 'h5' ? '1.5rem' : undefined, // static for faster paint
        ...(!color && { color: 'var(--text-primary)' }), // fallback only
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
