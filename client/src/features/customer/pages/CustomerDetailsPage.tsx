import { type FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import CustomerDetailHeader from '@features/customer/components/CustomerDetailHeader';
import CustomerDetailSection from '@features/customer/components/CustomerDetailSection';
import useCustomers from '@hooks/useCustomers';

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
        <CustomTypography>Loading customer details...</CustomTypography>
      )}

      {/* Show error message */}
      {customerDetailError && (
        <CustomTypography color="error">
          Error: {customerDetailError}
        </CustomTypography>
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
            <CustomTypography variant="h6" sx={{ mb: 2 }}>
              Customer Orders
            </CustomTypography>
            {/*<OrdersList customerId={customerId} />*/}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CustomerDetailsPage;
