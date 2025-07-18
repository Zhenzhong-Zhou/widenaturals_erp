import { type FC } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import DetailsSection, {
  type DetailsSectionField,
} from '@components/common/DetailsSection';
import CustomTypography from '@components/common/CustomTypography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import type { CustomerResponse } from '@features/customer/state';
import { formatLabel } from '@utils/textUtils.ts';
import AddAddressButton from '@features/address/components/AddAddressButton';

interface CustomerSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  customers?: CustomerResponse | CustomerResponse[];

  /**
   * Callback to trigger address creation dialog.
   */
  onAddAddressClick?: () => void;
}

const CustomerSuccessDialog: FC<CustomerSuccessDialogProps> = ({
  open,
  onClose,
  message = 'Customer(s) created successfully.',
  customers,
  onAddAddressClick,
}) => {
  const transformFields = (data: CustomerResponse): DetailsSectionField[] => [
    {
      label: 'Customer Name',
      value: `${data.firstname} ${data.lastname}`,
      format: (value) => formatLabel(value),
    },
    { label: 'Email', value: data.email },
    { label: 'Phone Number', value: data.phoneNumber },
    {
      label: 'Status',
      value: data.status?.name ?? '—',
      format: (value) => formatLabel(value),
    },
  ];

  const customerList = Array.isArray(customers)
    ? customers
    : customers
      ? [customers]
      : [];

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Customer Created"
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
    >
      <Box sx={{ px: 5 }}>
        <CustomTypography variant="body1" sx={{ mb: 2 }}>
          {message}
        </CustomTypography>

        <Stack spacing={4}>
          {customerList.map((customer, idx) => (
            <DetailsSection
              key={`customer-${idx}`}
              sx={{ mt: 1 }}
              sectionTitle={
                customerList.length > 1
                  ? `Customer #${idx + 1}`
                  : 'Customer Details'
              }
              fields={transformFields(customer)}
            />
          ))}
        </Stack>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <AddAddressButton
            onClick={onAddAddressClick} // Trigger the address dialog
            variant="outlined"
            color="primary"
          />
        </Box>
      </Box>
    </CustomDialog>
  );
};

export default CustomerSuccessDialog;
