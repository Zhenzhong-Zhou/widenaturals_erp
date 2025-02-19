import { FC } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@components/index.ts';
import { useThemeContext } from '../../context/ThemeContext';

interface MetadataSectionProps {
  data: Record<string, string | number>;
}

const MetadataSection: FC<MetadataSectionProps> = ({ data }) => {
  const { theme } = useThemeContext();

  return (
    <Box sx={{ marginTop: theme.spacing(2) }}>
      {Object.entries(data).map(([key, value]) => (
        <Box key={key} sx={{ marginBottom: theme.spacing(1) }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
          >
            {key}:
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary }}
          >
            {value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default MetadataSection;
