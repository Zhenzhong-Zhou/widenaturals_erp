import type { FC } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

interface SkeletonExpandedProps {
  /** Show or hide the summary block skeleton */
  showSummary?: boolean;
  /** Number of field label/value pairs to render */
  fieldPairs?: number;
  /** Custom height for the summary block skeleton */
  summaryHeight?: number;
  /** Spacing between each field pair skeleton */
  spacing?: number;
}

const SkeletonExpandedRow: FC<SkeletonExpandedProps> = ({
  showSummary = true,
  fieldPairs = 4,
  summaryHeight = 80,
  spacing = 1,
}) => (
  <Box sx={{ px: 3, py: 2 }}>
    {showSummary && (
      <Skeleton
        variant="rectangular"
        height={summaryHeight}
        animation="wave"
        sx={{ mb: 2 }}
      />
    )}

    {[...Array(fieldPairs)].map((_, i) => (
      <Box key={i} sx={{ mb: spacing }}>
        <Skeleton variant="text" width="40%" height={24} animation="wave" />
        <Skeleton variant="text" width="70%" height={24} animation="wave" />
      </Box>
    ))}
  </Box>
);

export default SkeletonExpandedRow;
