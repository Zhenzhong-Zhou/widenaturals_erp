import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import useCustomers from '@hooks/useCustomers';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import CustomModal from '@components/common/CustomModal';
import type { BulkCustomerRequest, CustomerRequest } from '@features/customer';

interface CreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal for Creating a New Customer with Google Autocomplete support.
 */
const CreateCustomerModal: FC<CreateCustomerModalProps> = ({
  open,
  onClose,
}) => {
  const { createCustomer, loading, refreshCustomers } = useCustomers();
  const { control, handleSubmit, reset } = useForm<CustomerRequest>();

  const handleFormSubmit = () =>
    handleSubmit(async (formData) => {
      if (loading) return;

      const customersData: BulkCustomerRequest = [
        {
          ...formData,
          address_line2: formData.address_line2 || '',
        },
      ];

      await createCustomer(customersData);
      reset();
      onClose();
      refreshCustomers();
    })();

  const customerFormFields: FieldConfig[] = [
    { id: 'firstname', label: 'First Name', type: 'text', required: true },
    { id: 'lastname', label: 'Last Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'text' },
    { id: 'phone_number', label: 'Phone Number', type: 'phone' },
    {
      id: 'address_line1',
      label: 'Address Line 1',
      type: 'text',
      required: true,
    },
    { id: 'address_line2', label: 'Address Line 2', type: 'text' },
    { id: 'city', label: 'City', type: 'text', required: true },
    { id: 'state', label: 'State / Province', type: 'text', required: true },
    { id: 'postal_code', label: 'Postal Code', type: 'text', required: true },
    { id: 'country', label: 'Country', type: 'text', required: true },
    { id: 'region', label: 'Region', type: 'text' },
    { id: 'note', label: 'Note', type: 'textarea' },
  ];

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Create Customer"
      sx={{
        maxWidth: '900px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      <Box
        sx={{
          maxHeight: '75vh',
          overflowY: 'auto',
          px: 2,
          py: 1,
        }}
      >
        <CustomForm
          fields={customerFormFields}
          control={control}
          onSubmit={handleFormSubmit}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        />
      </Box>
    </CustomModal>
  );
};

export default CreateCustomerModal;
