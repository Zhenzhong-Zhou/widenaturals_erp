import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Typography, Stack, Chip, Divider } from '@mui/material';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';

interface LocationState {
  allocationIds?: string[];
  category?: string;
}

const InventoryAllocationReviewPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const { allocationIds = [], category }: LocationState = location.state || {};
  
  // Example: trigger API call here if needed
  useEffect(() => {
    if (orderId && allocationIds.length) {
      console.log('Reviewing allocations:', { orderId, allocationIds });
      // You can fetch more details here
    }
  }, [orderId, allocationIds]);
  
  if (!orderId) {
    return <ErrorMessage message="Missing order ID in URL." />;
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Inventory Allocation Review
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        Order ID: <strong>{orderId}</strong>
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {allocationIds.length > 0 ? (
        <Stack spacing={1}>
          <Typography variant="subtitle1">Allocated Inventory IDs:</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {allocationIds.map((id) => (
              <Chip key={id} label={id} variant="outlined" color="primary" />
            ))}
          </Stack>
        </Stack>
      ) : (
        <Typography color="text.secondary">
          No allocation IDs provided.
        </Typography>
      )}
      
      <Box mt={4}>
        <CustomButton variant="outlined" href={`/orders/${category}/details/${orderId}`}>
          Back to Order
        </CustomButton>
      </Box>
    </Box>
  );
};

export default InventoryAllocationReviewPage;
