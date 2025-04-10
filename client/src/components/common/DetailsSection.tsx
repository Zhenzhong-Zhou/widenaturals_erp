import { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography';
import { useThemeContext } from '@context/ThemeContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { SxProps, Theme } from '@mui/system';
import { formatLabel } from '@utils/textUtils';

interface DetailsSectionProps {
  data: Record<string, any>;
  sx?: SxProps<Theme>;
}

const INLINE_DISPLAY_LENGTH = 50;  // Max length of text for inline display on large screens

const DetailsSection: FC<DetailsSectionProps> = ({ data, sx }) => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
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
              {formatLabel(key)}:
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
