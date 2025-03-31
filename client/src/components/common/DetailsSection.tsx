import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography.tsx';
import { useThemeContext } from '../../context/ThemeContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { SxProps, Theme } from '@mui/system';

interface DetailsSectionProps {
  data: Record<string, any>;
  sx?: SxProps<Theme>;
}

const INLINE_DISPLAY_LENGTH = 50;  // Max length of text for inline display on large screens

const DetailsSection: FC<DetailsSectionProps> = ({ data, sx }) => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
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
      {Object.entries(data).map(([key, value]) => {
        const isNoteField = key.toLowerCase().includes('note');
        const isLongText = typeof value === 'string' && value.length > INLINE_DISPLAY_LENGTH;
        
        const shouldDisplayInline = !isNoteField && (!isSmallScreen && !isLongText);
        
        return (
          <Box
            key={key}
            sx={{
              marginBottom: theme.spacing(1),
              display: shouldDisplayInline ? 'flex' : 'block',
              alignItems: 'center'
            }}
          >
            {/* Label */}
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: theme.palette.text.primary, marginRight: 1 }}
            >
              {formatFieldName(key)}:
            </Typography>
            
            {/* Value */}
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
                sx={{ color: theme.palette.text.secondary, whiteSpace: shouldDisplayInline ? 'nowrap' : 'normal' }}
              >
                {value !== null && value !== undefined ? value.toString() : 'N/A'}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default DetailsSection;
