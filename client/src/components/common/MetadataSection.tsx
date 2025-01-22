import { FC } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@components/index.ts';

interface MetadataSectionProps {
  data: Record<string, string | number>;
}

const MetadataSection: FC<MetadataSectionProps> = ({ data }) => (
  <Box sx={{ marginTop: 2 }}>
    {Object.entries(data).map(([key, value]) => (
      <Box key={key} sx={{ marginBottom: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {key}:
        </Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    ))}
  </Box>
);

export default MetadataSection;
