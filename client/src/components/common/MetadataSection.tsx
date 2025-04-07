import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useThemeContext } from '../../context/ThemeContext';
import type { SxProps, Theme } from '@mui/system';
import { formatLabel } from '@utils/textUtils.ts';

// Helper to exclude keys like `id`, `uuid`, etc.
const shouldExcludeKey = (key: string): boolean =>
  /id$/i.test(key) || /_id$/i.test(key) || /uuid/i.test(key);

// Recursive metadata display
interface MetadataSectionProps {
  data: Record<string, any>;
  sx?: SxProps<Theme>;
}

const MetadataSection: FC<MetadataSectionProps> = ({ data, sx }) => {
  const { theme } = useThemeContext();
  
  return (
    <Box sx={{ mt: theme.spacing(2), ...sx }}>
      {Object.entries(data).map(([key, value]) => {
        if (shouldExcludeKey(key)) return null;
        
        const formattedKey = formatLabel(key);
        
        return (
          <Box key={key} sx={{ mb: theme.spacing(1) }}>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.primary }}
            >
              {formattedKey}:
            </Typography>
            
            {Array.isArray(value) ? (
              <Box sx={{ pl: theme.spacing(2) }}>
                {value.map((item, index) => (
                  <MetadataSection key={index} data={item} sx={sx} />
                ))}
              </Box>
            ) : typeof value === 'object' && value !== null ? (
              <Box sx={{ pl: theme.spacing(2) }}>
                <MetadataSection data={value} sx={sx} />
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                {value !== null && value !== '' ? value.toString() : 'N/A'}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default MetadataSection;
