import { FC } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@components/index.ts';
import { useThemeContext } from '../../context/ThemeContext';

interface MetadataSectionProps {
  data: Record<
    string,
    string | number | Record<string, any> | Record<string, any>[]
  >;
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

          {Array.isArray(value) ? (
            <Box sx={{ paddingLeft: theme.spacing(2) }}>
              {value.map((item, index) => (
                <MetadataSection key={index} data={item} /> // Recursively render array items
              ))}
            </Box>
          ) : typeof value === 'object' && value !== null ? (
            <Box sx={{ paddingLeft: theme.spacing(2) }}>
              <MetadataSection data={value} /> // Recursively render nested
              objects
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary }}
            >
              {value !== null ? value.toString() : 'N/A'}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MetadataSection;
