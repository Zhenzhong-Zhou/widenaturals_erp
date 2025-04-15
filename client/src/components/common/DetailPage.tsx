import type { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import Loading from '@components/common/Loading';
import { useThemeContext } from '@context/ThemeContext';

interface DetailPageProps {
  title: string;
  isLoading: boolean;
  error?: string | null;
  children: ReactNode;
  sx?: object;
}

const DetailPage: FC<DetailPageProps> = ({
                                           title,
                                           isLoading,
                                           error,
                                           children,
                                           sx,
                                         }) => {
  const { theme } = useThemeContext();
  
  if (isLoading) {
    return (
      <Box
        component="main"
        role="main"
        aria-busy="true"
        sx={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.background.default,
          ...sx,
        }}
      >
        <Loading message={`Loading ${title.toLowerCase()}...`} fullPage />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        component="main"
        role="alert"
        sx={{
          textAlign: 'center',
          py: theme.spacing(6),
          px: theme.spacing(2),
          maxWidth: 800,
          mx: 'auto',
          color: theme.palette.error.main,
          ...sx,
        }}
      >
        <CustomTypography variant="h6">{error}</CustomTypography>
      </Box>
    );
  }
  
  return (
    <Box
      component="main"
      sx={{
        py: theme.spacing(4),
        px: theme.spacing(2),
        maxWidth: 900,
        mx: 'auto',
        color: theme.palette.text.primary,
        fontFamily: "'Roboto', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        ...sx,
      }}
    >
      <CustomTypography
        variant="h4"
        sx={{
          mb: theme.spacing(3),
          fontWeight: 600,
          lineHeight: 1.4,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </CustomTypography>
      {children}
    </Box>
  );
};

export default DetailPage;
