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
      component={variant?.startsWith('h') ? variant : 'p'} // Ensure correct semantic tag
      variant={variant}
      color={color}
      align={align}
      {...props}
      sx={{
        marginBottom: '8px', // Static spacing avoids LCP delays from dynamic theme spacing
        fontFamily: "'Roboto', sans-serif", // Use static value to prevent FOUT
        ...props.sx,
      }}
    >
      {children}
    </MuiTypography>
  );
};

export default CustomTypography;
