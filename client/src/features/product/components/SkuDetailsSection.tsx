import { memo, type CSSProperties, type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { SkuDetails } from '../state';
import { mapSkuToDisplayMetadata } from '../utils/skuTransformers';

interface SkuDetailsSectionProps {
  data: SkuDetails;
  show?: (keyof SkuDetails)[]; // Optional allowlist
  sx?: CSSProperties;
}

const LabelValuePair = ({ label, value }: { label: string; value: string }) => (
  <Box mb={1.5}>
    <Typography variant="body2" fontWeight={600}>
      {label}:
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {value}
    </Typography>
  </Box>
);

const SkuDetailsSection: FC<SkuDetailsSectionProps> = ({ data, show, sx }) => {
  const grouped = mapSkuToDisplayMetadata(data);
  
  // Optional: filter by allowed section titles
  const sections = show
    ? Object.entries(grouped).filter(([key]) => show.includes(key as keyof SkuDetails))
    : Object.entries(grouped);
  
  return (
    <Box sx={{ width: '100%', ...sx }}>
      {sections.map(([sectionTitle, fields], index) => (
        <Box
          key={sectionTitle}
          sx={{
            mb: 4,
            pt: index > 0 ? 2 : 0,
            borderTop: index > 0 ? '1px solid #eee' : 'none',
          }}
        >
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {sectionTitle}
          </Typography>
          
          <Grid container spacing={2}>
            {Object.entries(fields).map(([label, value]) => (
              <Grid size={{xs: 12, sm: 6}} key={label}>
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
