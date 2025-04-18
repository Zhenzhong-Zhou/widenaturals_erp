import { FC } from 'react';
import MuiTypography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';
import { useThemeContext } from '../../context/ThemeContext';

interface CustomTypographyProps extends TypographyProps {
  variant?: TypographyProps['variant'];
  color?: TypographyProps['color'];
  align?: TypographyProps['align'];
}

const Typography: FC<CustomTypographyProps> = ({
  children,
  variant = 'body1', // Default variant
  color = 'textPrimary', // Default text color
  align = 'inherit', // Default alignment
  ...props
}) => {
  const { theme } = useThemeContext();

  return (
    <MuiTypography
      variant={variant}
      color={color}
      align={align}
      {...props}
      sx={{
        marginBottom: theme.spacing(1), // Default spacing from theme
        fontFamily: theme.typography.fontFamily, // Use fontFamily from theme
        ...props.sx, // Allow custom styles to override
      }}
    >
      {children}
    </MuiTypography>
  );
};

export default Typography;
