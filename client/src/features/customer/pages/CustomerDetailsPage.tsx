import { FC, useEffect } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@components/index.ts';
import { CustomerDetailHeader, CustomerDetailSection } from '../index.ts';
import { useCustomers } from '../../../hooks';
import { useParams } from 'react-router-dom';
import Divider from '@mui/material/Divider';

const CustomerDetailsPage: FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const {
    customerDetail,
    customerDetailLoading,
    customerDetailError,
    refreshCustomerDetail,
  } = useCustomers();

  // Fetch customer details when customerId changes
  useEffect(() => {
    if (customerId) {
      refreshCustomerDetail(customerId);
    }
  }, [customerId, refreshCustomerDetail]);

  return (
    <Box sx={{ display: 'flex', gap: 4, p: 3, flexWrap: 'wrap' }}>
      {/* Show loading state */}
      {customerDetailLoading && (
        <Typography>Loading customer details...</Typography>
      )}

      {/* Show error message */}
      {customerDetailError && (
        <Typography color="error">Error: {customerDetailError}</Typography>
      )}

      {/* Show customer details when available */}
      {customerDetail && (
        <Box sx={{ flex: 1, minWidth: 350 }}>
          <CustomerDetailHeader customerName={customerDetail.customerName} />
          <CustomerDetailSection
            customer={customerDetail}
            loading={customerDetailLoading}
            error={customerDetailError}
          />

          {/* Vertical Divider */}
          <Divider
            orientation="vertical"
            flexItem
            sx={{ mx: 2, bgcolor: 'rgba(0,0,0,0.1)' }}
          />

          {/* Right: Related Data */}
          <Box sx={{ flex: 2, minWidth: 500 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Customer Orders
            </Typography>
            {/*<OrdersList customerId={customerId} />*/}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomerDetailsPage;
