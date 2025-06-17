import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

const SkeletonExpandedRow = () => (
  <Box sx={{ px: 3, py: 2 }}>
    <Skeleton variant="text" width="30%" height={32} />
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} variant="rectangular" height={28} sx={{ my: 1 }} />
    ))}
  </Box>
);

export default SkeletonExpandedRow;
