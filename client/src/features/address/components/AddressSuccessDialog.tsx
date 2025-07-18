import { type FC } from 'react';
import CustomDialog from '@components/common/CustomDialog';
import DetailsSection, { type DetailsSectionField } from '@components/common/DetailsSection';
import CustomTypography from '@components/common/CustomTypography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import type { AddressResponse } from '@features/address/state';
import { formatDateTime } from '@utils/dateTimeUtils.ts';

interface AddressSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  message?: string;
  addresses?: AddressResponse | AddressResponse[];
}

const AddressSuccessDialog: FC<AddressSuccessDialogProps> = ({
                                                               open,
                                                               onClose,
                                                               message = 'Address(es) created successfully.',
                                                               addresses,
                                                             }) => {
  const transformFields = (data: AddressResponse): DetailsSectionField[] => [
    { label: 'Customer', value: data.customer?.fullName ?? '—' },
    { label: 'Customer Email', value: data.customer?.fullName ?? '—' },
    { label: 'Customer Phone Number', value: data.customer?.fullName ?? '—' },
    { label: 'Label', value: data.label },
    { label: 'Recipient Name', value: data.recipientName },
    { label: 'Phone', value: data.phone },
    { label: 'Email', value: data.email },
    { label: 'Address', value: data.displayAddress },
    { label: 'Note', value: data.note },
    { label: 'Created By', value: data.createdBy?.fullName ?? '—' },
    { label: 'Created At', value: formatDateTime(data.createdAt) },
    { label: 'Updated By', value: data.updatedBy?.fullName ?? '-' },
  ];
  
  const addressList = Array.isArray(addresses) ? addresses : addresses ? [addresses] : [];
  
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Address Created"
      confirmButtonText="Close"
      onConfirm={onClose}
      showCancelButton={false}
    >
      <Box sx={{ px: 5 }}>
        <CustomTypography variant="body1" sx={{ mb: 2 }}>
          {message}
        </CustomTypography>
        
        <Stack spacing={4}>
          {addressList.map((address, idx) => (
            <DetailsSection
              key={`address-${idx}`}
              sx={{ mt: 1 }}
              sectionTitle={
                addressList.length > 1
                  ? `Address #${idx + 1}`
                  : 'Address Details'
              }
              fields={transformFields(address)}
            />
          ))}
        </Stack>
      </Box>
    </CustomDialog>
  );
};

export default AddressSuccessDialog;
