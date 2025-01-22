import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Typography, Loading } from '@components/index.ts';
import { useThemeContext } from '../../context/ThemeContext.tsx';

interface DetailPageProps {
  title: string;
  isLoading: boolean;
  error?: string;
  children: ReactNode;
}

const DetailPage: FC<DetailPageProps> = ({ title, isLoading, error, children }) => {
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
        }}
      >
        <Loading message={`Loading ${title.toLowerCase()}...`} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          padding: theme.spacing(3),
        }}
      >
        <Typography variant="h6" color={theme.palette.error.main}>
          {error}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ padding: theme.spacing(3), maxWidth: 600, margin: '0 auto' }}>
      <Typography variant="h4" sx={{ marginBottom: theme.spacing(2) }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
};

export default DetailPage;
