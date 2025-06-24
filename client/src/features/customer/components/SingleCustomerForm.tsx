import type { FC } from 'react';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';
import { emailValidator } from '@utils/validation.ts';

interface SingleCustomerFormProps {
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  loading?: boolean;
}

const customerFormFields: FieldConfig[] = [
  { id: 'firstname', label: 'First Name', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'lastname', label: 'Last Name', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'email', label: 'Email', type: 'email', required: true, validation: emailValidator, grid: { xs: 12, sm: 6 } },
  { id: 'phone_number', label: 'Phone Number', type: 'phone', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'address_line1', label: 'Address Line 1', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'address_line2', label: 'Address Line 2', type: 'text', grid: { xs: 12, sm: 6 } },
  { id: 'city', label: 'City', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'state', label: 'State / Province', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'postal_code', label: 'Postal Code', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
  { id: 'country', label: 'Country', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
  { id: 'region', label: 'Region', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
  { id: 'note', label: 'Note', type: 'textarea', grid: { xs: 12 } },
];

const SingleCustomerForm: FC<SingleCustomerFormProps> = ({ onSubmit, loading }) => {
  return (
    <CustomForm
      fields={customerFormFields}
      onSubmit={onSubmit}
      submitButtonLabel="Create Customer"
      disabled={loading}
      showSubmitButton
      sx={{ maxWidth: { xs: '100%', sm: '800px' } }}
    />
  );
};

export default SingleCustomerForm;
