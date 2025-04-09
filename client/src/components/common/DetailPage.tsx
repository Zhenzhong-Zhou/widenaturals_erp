import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography';
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
        sx={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.background.default,
          ...sx,
        }}
      >
        <Loading message={`Loading ${title.toLowerCase()}...`} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', padding: theme.spacing(3), ...sx }}>
        <Typography variant="h6" color={theme.palette.error.main}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ padding: theme.spacing(3), maxWidth: 900, margin: '0 auto', ...sx }}
    >
      <Typography variant="h4" sx={{ marginBottom: theme.spacing(2) }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default DetailPage;
