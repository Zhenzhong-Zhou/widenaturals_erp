import type { FC } from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';
import type { SxProps, Theme } from '@mui/system';

interface DetailHeaderProps {
  avatarSrc?: string;
  avatarFallback?: string;
  name: string;
  subtitle?: string;
  sx?: SxProps<Theme>; // Allow override
}

const DetailHeader: FC<DetailHeaderProps> = ({
  avatarSrc,
  avatarFallback,
  name,
  subtitle,
  sx,
}) => {
  const { theme } = useThemeContext();

  return (
    <Box
      sx={{
        textAlign: 'center',
        mb: 3,
        minHeight: 180, // Prevent layout shift (LCP)
        ...sx,
      }}
    >
      <Avatar
        src={avatarSrc}
        alt={name}
        sx={{
          width: 'clamp(80px, 10vw, 100px)',
          height: 'clamp(80px, 10vw, 100px)',
          mx: 'auto',
          bgcolor: theme.palette.primary.main,
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          fontWeight: 600,
          fontFamily: "'Roboto', sans-serif",
        }}
      >
        {avatarFallback || name.charAt(0).toUpperCase()}
      </Avatar>

      <CustomTypography
        variant="h6"
        sx={{
          mt: 2,
          color: theme.palette.text.primary,
          fontWeight: 600,
          fontSize: '1.125rem',
          textRendering: 'optimizeLegibility',
        }}
      >
        {name}
      </CustomTypography>

      {subtitle && (
        <CustomTypography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            mt: 0.5,
            fontSize: '0.875rem',
          }}
        >
          {subtitle}
        </CustomTypography>
      )}
    </Box>
  );
};

export default DetailHeader;
