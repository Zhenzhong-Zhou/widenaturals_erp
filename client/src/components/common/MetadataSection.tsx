import type { FC } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useThemeContext } from '@context/ThemeContext';
import type { SxProps, Theme } from '@mui/system';
import { formatLabel } from '@utils/textUtils';

// Exclude keys like id, uuid, etc.
const shouldExcludeKey = (key: string): boolean => /(^|_)id$|uuid/i.test(key);

// Helper to check if value is a primitive or displayable
const isSimpleValue = (value: any): boolean =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean';

interface MetadataSectionProps {
  data: Record<string, any>;
  title?: string;
  sx?: SxProps<Theme>;
}

const MetadataSection: FC<MetadataSectionProps> = ({ data, title, sx }) => {
  const { theme } = useThemeContext();

  return (
    <Box sx={{ mt: theme.spacing(2), ...sx }}>
      {title && (
        <Typography
          variant="subtitle1"
          sx={{
            mb: theme.spacing(1),
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
      )}

      {Object.entries(data).map(([key, value]) => {
        if (shouldExcludeKey(key)) return null;

        const formattedKey = formatLabel(key);

        return (
          <Box key={key} sx={{ mb: theme.spacing(1.5) }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              {formattedKey}:
            </Typography>

            {/* Recursive for nested values */}
            {Array.isArray(value) ? (
              <Box sx={{ pl: theme.spacing(2), pt: 0.5 }}>
                {value.map((item, index) =>
                  typeof item === 'object' && item !== null ? (
                    <MetadataSection key={index} data={item} sx={sx} />
                  ) : isSimpleValue(item) ? (
                    <Typography
                      key={`${item}-${index}`}
                      variant="body2"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {item?.toString() || 'N/A'}
                    </Typography>
                  ) : null
                )}
              </Box>
            ) : typeof value === 'object' && value !== null ? (
              <Box sx={{ pl: theme.spacing(2), pt: 0.5 }}>
                <MetadataSection data={value} sx={sx} />
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                {value !== null && value !== '' && value !== undefined
                  ? value.toString()
                  : 'N/A'}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default MetadataSection;
