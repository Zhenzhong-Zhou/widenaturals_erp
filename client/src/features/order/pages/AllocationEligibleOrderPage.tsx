import { Suspense } from 'react';
import { Box, Skeleton } from '@mui/material';
import AllocationEligibleOrdersTable from '@features/order/components/AllocationEligibleOrdersTable';

const AllocationEligibleOrderPage = () => {
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <Suspense
        fallback={
          <Skeleton
            variant="rectangular"
            height={400}
            sx={{ borderRadius: 2 }}
            animation="wave"
          />
        }
      >
        <AllocationEligibleOrdersTable />
      </Suspense>
    </Box>
  );
};

export default AllocationEligibleOrderPage;
