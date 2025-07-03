import type { FC } from 'react';
import CustomForm from '@components/common/CustomForm';
import type { FieldConfig } from '@components/common/CustomForm';
import { emailValidator } from '@utils/validation';
import CustomTypography from '@components/common/CustomTypography.tsx';

interface SingleAddressFormProps {
  loading?: boolean;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  customerNames: string[];
}

const addressFormFields: FieldConfig[] = [
  { id: 'label', label: 'Label', type: 'text', required: false, grid: { xs: 12, sm: 6 } },
  { id: 'full_name', label: 'Recipient Name', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'phone', label: 'Phone Number', type: 'phone', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'email', label: 'Email', type: 'email', required: true, validation: emailValidator, grid: { xs: 12, sm: 6 } },
  { id: 'address_line1', label: 'Address Line 1', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'address_line2', label: 'Address Line 2', type: 'text', required: false, grid: { xs: 12, sm: 6 } },
  { id: 'city', label: 'City', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'state', label: 'State / Province', type: 'text', required: true, grid: { xs: 12, sm: 6 } },
  { id: 'postal_code', label: 'Postal Code', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
  { id: 'country', label: 'Country', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
  { id: 'region', label: 'Region', type: 'text', required: true, grid: { xs: 12, sm: 4 } },
  { id: 'note', label: 'Note', type: 'textarea', grid: { xs: 12 } },
];

const SingleAddressForm: FC<SingleAddressFormProps> = ({ loading, onSubmit, customerNames }) => {
  const displayName = customerNames.length === 1
    ? customerNames[0]
    : customerNames.join(', '); // fallback if an array has more
  
  return (
    <>
      <CustomTypography variant="subtitle1" sx={{ mb: 1 }}>
        Adding address for: {displayName}
      </CustomTypography>
      
      <CustomForm
        fields={addressFormFields}
        onSubmit={onSubmit}
        submitButtonLabel="Create Address"
        disabled={loading}
        showSubmitButton
        sx={{ maxWidth: { xs: '100%', sm: '800px' } }}
      />
    </>
  );
};

export default SingleAddressForm;
