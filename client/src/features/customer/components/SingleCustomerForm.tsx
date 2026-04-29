import type { FC } from 'react';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';
import { emailValidator } from '@utils/validation';

interface SingleCustomerFormProps {
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  loading?: boolean;
}

export const CUSTOMER_TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Individual', value: 'individual' },
  { label: 'Company',    value: 'company'    },
];

const customerFormFields: FieldConfig[] = [
  {
    id: 'customer_type',
    label: 'Customer Type',
    type: 'select',
    required: true,
    options: CUSTOMER_TYPE_OPTIONS,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'company_name',
    label: 'Company Name',
    type: 'text',
    required: false,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'firstname',
    label: 'First Name',
    type: 'text',
    required: true,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'lastname',
    label: 'Last Name',
    type: 'text',
    required: true,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    validation: emailValidator,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'phone_number',
    label: 'Phone Number',
    type: 'phone',
    required: true,
    grid: { xs: 12, sm: 6 },
  },
  { id: 'note', label: 'Note', type: 'textarea', grid: { xs: 12 } },
];

const SingleCustomerForm: FC<SingleCustomerFormProps> = ({
  onSubmit,
  loading,
}) => {
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
