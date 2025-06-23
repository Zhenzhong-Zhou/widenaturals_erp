import type { FC } from 'react';
import MultiItemForm, { type MultiItemFieldConfig } from '@components/common/MultiItemForm';
import { emailValidator } from '@utils/validation';

export interface BulkCustomerFormProps {
  onSubmit: (customers: Record<string, any>[]) => void;
  loading?: boolean;
}

const customerFields: MultiItemFieldConfig[] = [
  { id: 'firstname', label: 'First Name', type: 'text', required: true },
  { id: 'lastname', label: 'Last Name', type: 'text', required: true },
  { id: 'email', label: 'Email', type: 'email', required: true,
    validation: emailValidator,
  },
  { id: 'phone_number', label: 'Phone Number', type: 'phone', required: true },
  { id: 'address_line1', label: 'Address Line 1', type: 'text', required: true },
  { id: 'address_line2', label: 'Address Line 2', type: 'text' },
  { id: 'city', label: 'City', type: 'text', required: true },
  { id: 'state', label: 'State / Province', type: 'text', required: true },
  { id: 'postal_code', label: 'Postal Code', type: 'text', required: true },
  { id: 'country', label: 'Country', type: 'text', required: true },
  { id: 'region', label: 'Region', type: 'text', required: true },
  { id: 'notes', label: 'Note', type: 'textarea' },
];

const BulkCustomerForm: FC<BulkCustomerFormProps> = ({ onSubmit, loading }) => {
  return (
    <MultiItemForm
      fields={customerFields}
      onSubmit={onSubmit}
      loading={loading}
      validation={() =>
        Object.fromEntries(
          customerFields.filter((f) => f.validation).map((f) => [f.id, f.validation!])
        )
      }
      getItemTitle={(_index, item) =>
        `${item.firstname || ''} ${item.lastname || ''}`.trim() || 'Customer Name'
      }
    />
  );
};

export default BulkCustomerForm;
