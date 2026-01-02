import { type FC, isValidElement, memo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { SxProps, Theme } from '@mui/system';
import CustomTypography from '@components/common/CustomTypography';
import { useThemeContext } from '@context/ThemeContext';

type DisplayValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, any>;

export interface DetailsSectionField {
  label: string;
  value: DisplayValue;
  format?: (value: any) => string | ReactNode;
}

interface DetailsSectionProps {
  fields: DetailsSectionField[];
  sectionTitle?: string;
  sx?: SxProps<Theme>;

  /**
   * Number of columns to display fields in.
   * - 1: stacked (card / mobile / compact views)
   * - 2: default (detail / expanded / desktop views)
   */
  columns?: 1 | 2;

  /**
   * Content alignment for label + value.
   * - 'left': default (tables, expanded rows)
   * - 'center': cards / profile views
   */
  align?: 'left' | 'center';
}

const INLINE_DISPLAY_LENGTH = 40;

const DetailsSection: FC<DetailsSectionProps> = ({
  fields,
  sectionTitle,
  sx,
  columns,
  align = 'left',
}) => {
  const { theme } = useThemeContext();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const filteredFields = fields.filter(
    ({ value }) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !(
        typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value
        )
      )
  );

  if (filteredFields.length === 0) return null;

  const columnSize = columns === 1 ? { xs: 12 } : { xs: 12, md: 6 };

  const textAlign = align === 'center' ? 'center' : 'left';
  const alignItems = align === 'center' ? 'center' : 'flex-start';

  return (
    <Box sx={{ mt: theme.spacing(2), ...sx }}>
      {sectionTitle && (
        <CustomTypography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            mb: 1.5,
            color: theme.palette.text.primary,
          }}
        >
          {sectionTitle}
        </CustomTypography>
      )}

      <Grid container spacing={2}>
        {filteredFields.map(({ label, value, format }, index) => {
          const isLongText =
            typeof value === 'string' && value.length > INLINE_DISPLAY_LENGTH;
          const shouldWrap = isLongText || isSmallScreen;

          const raw = format
            ? format(value)
            : value !== null && value !== undefined
              ? value.toString()
              : 'N/A';

          const isNode = isValidElement(raw);

          return (
            <Grid size={columnSize} key={index}>
              <Box sx={{ textAlign, alignItems }}>
                <CustomTypography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    textAlign,
                  }}
                >
                  {label}:
                </CustomTypography>

                {isNode ? (
                  // IMPORTANT: do NOT wrap a React element (which may be a <div>) in Typography <p>
                  <Box sx={{ mt: 0.5, textAlign }}>{raw}</Box>
                ) : (
                  <CustomTypography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      textAlign,
                      whiteSpace: shouldWrap ? 'normal' : 'nowrap',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                    }}
                  >
                    {raw as string}
                  </CustomTypography>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default memo(DetailsSection);
