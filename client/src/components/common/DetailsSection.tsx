import { type FC, memo } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { SxProps, Theme } from '@mui/system';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';
import { formatLabel } from '@utils/textUtils';

interface DetailsSectionProps {
  data: Record<string, any>;
  sx?: SxProps<Theme>;
}

const INLINE_DISPLAY_LENGTH = 50; // Max length of text for inline display

const DetailsSection: FC<DetailsSectionProps> = ({ data, sx }) => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        mt: theme.spacing(2),
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(1.25),
        ...sx,
      }}
    >
      {Object.entries(data)
        .filter(
          ([_, value]) =>
            !(
              typeof value === 'string' &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                value
              )
            )
        )
        .map(([key, value]) => {
        const label = formatLabel(key);
        const isNote = key.toLowerCase().includes('note');
        const isLongText = typeof value === 'string' && value.length > INLINE_DISPLAY_LENGTH;
        
        const shouldInline = !isNote && !isSmallScreen && !isLongText;
        
        return (
          <Box
            key={key}
            sx={{
              display: shouldInline ? 'flex' : 'block',
              alignItems: 'center',
              flexWrap: 'wrap',
              rowGap: 0.5,
            }}
          >
            {/* Label */}
            <CustomTypography
              variant="body2"
              component="span"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                mr: 1,
                minWidth: 120,
              }}
              aria-label={`${label} label`}
            >
              {label}:
            </CustomTypography>
            
            {/* Recursive Object or Array */}
            {Array.isArray(value) ? (
              <Box sx={{ pl: 2 }}>
                {value.map((item, index) => (
                  <DetailsSection
                    key={`${key}-${index}`}
                    data={item}
                    sx={{ pl: 2 }}
                  />
                ))}
              </Box>
            ) : typeof value === 'object' && value !== null ? (
              <Box sx={{ pl: 2 }}>
                <DetailsSection data={value} />
              </Box>
            ) : (
              // Primitive value
              <CustomTypography
                variant="body2"
                component="span"
                sx={{
                  color: theme.palette.text.secondary,
                  whiteSpace: shouldInline ? 'nowrap' : 'normal',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word',
                }}
              >
                {value !== null && value !== undefined
                  ? value.toString()
                  : 'N/A'}
              </CustomTypography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// Export the memoized version
const MemoizedDetailsSection = memo(DetailsSection);

export default MemoizedDetailsSection;
