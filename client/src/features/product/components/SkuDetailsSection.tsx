import { memo, type CSSProperties, type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import type { SkuDetails } from '../state';
import { mapSkuToDisplayMetadata } from '../utils/skuTransformers';

interface SkuDetailsSectionProps {
  data: SkuDetails;
  sx?: CSSProperties;
}

const LabelValuePair = ({ label, value }: { label: string; value: string }) => (
  <Box mb={1.5}>
    <CustomTypography variant="subtitle1" sx={{ fontWeight: 600 }}>
      {label}:
    </CustomTypography>
    <CustomTypography variant="subtitle2" color="text.secondary">
      {value}
    </CustomTypography>
  </Box>
);

const SkuDetailsSection: FC<SkuDetailsSectionProps> = ({ data, sx }) => {
  const grouped = mapSkuToDisplayMetadata(data);

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {Object.entries(grouped).map(([sectionTitle, fields], index) => (
        <Box
          key={sectionTitle}
          sx={{
            mb: 4,
            pt: index > 0 ? 2 : 0,
            borderTop: index > 0 ? '1px solid #eee' : 'none',
          }}
        >
          <CustomTypography variant="h5">{sectionTitle}</CustomTypography>

          <Grid container spacing={2}>
            {Object.entries(fields).map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={label}>
                <LabelValuePair label={label} value={value} />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export default memo(SkuDetailsSection);
