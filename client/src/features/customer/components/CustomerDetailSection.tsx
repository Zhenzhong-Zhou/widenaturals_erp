import type { FC } from 'react';
import Box from '@mui/material/Box';
import type { CustomerDetails } from '@features/customer';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import MetadataSection from '@components/common/MetadataSection';
import CustomButton from '@components/common/CustomButton';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatPhoneNumber } from '@utils/textUtils';

interface CustomerDetailsProps {
  customer: CustomerDetails;
  loading: boolean;
  error: string | null;
}

const CustomerDetailSection: FC<CustomerDetailsProps> = ({
                                                           customer,
                                                           loading,
                                                           error,
                                                         }) => {
  if (loading) return <Loading message={'Loading customer details...'} />;
  if (error)
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Metadata Section */}
      <MetadataSection
        data={{
          Email: customer.email,
          'Phone Number': formatPhoneNumber(customer.phoneNumber),
          Address: customer.address || 'N/A',
          Note: customer.note || 'N/A',
          Status: customer.statusName,
          'Status Date': formatDateTime(customer.statusDate),
          'Created By': customer.createdBy,
          'Created At': formatDateTime(customer.createdAt),
          'Updated By': customer.updatedBy,
          'Updated At': formatDateTime(customer.updatedAt),
        }}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: 2,
          borderRadius: 1,
        }}
      />
      
      {/* Actions */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <CustomButton variant="contained" color="primary">
          Edit Customer
        </CustomButton>
      </Box>
    </Box>
  );
};

export default CustomerDetailSection;
