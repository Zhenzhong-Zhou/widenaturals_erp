import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography.tsx';
import { useThemeContext } from '../../context/ThemeContext';
import type { SxProps, Theme } from '@mui/system';

interface DetailsSectionProps {
  data: Record<string, any>;
  sx?: SxProps<Theme>;
}

const DetailsSection: FC<DetailsSectionProps> = ({ data, sx }) => {
  const { theme } = useThemeContext();
  
  // Format field name to Title Case (handles snake_case & camelCase)
  const formatFieldName = (fieldName: string): string => {
    const spacedFieldName = fieldName
      .replace(/_/g, ' ')  // Convert snake_case to normal text
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2');  // Convert camelCase to normal text
    
    return spacedFieldName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <Box sx={{ marginTop: theme.spacing(2), ...sx }}>
      {Object.entries(data).map(([key, value]) => (
        <Box key={key} sx={{ marginBottom: theme.spacing(1) }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
          >
            {formatFieldName(key)}:
          </Typography>
          
          {Array.isArray(value) ? (
            <Box sx={{ paddingLeft: theme.spacing(2) }}>
              {value.map((item, index) => (
                <DetailsSection key={index} data={item} sx={sx} />
              ))}
            </Box>
          ) : typeof value === 'object' && value !== null ? (
            <Box sx={{ paddingLeft: theme.spacing(2) }}>
              <DetailsSection data={value} sx={sx} />
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

export default DetailsSection;
