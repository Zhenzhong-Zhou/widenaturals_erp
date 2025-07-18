import type { FC } from 'react';
import MultiItemForm, { type MultiItemFieldConfig } from '@components/common/MultiItemForm';
import { emailValidator } from '@utils/validation';

export interface BulkCustomerFormProps {
  onSubmit: (customers: Record<string, any>[]) => void;
  loading?: boolean;
}

const customerFields: MultiItemFieldConfig[] = [
  { id: 'firstname', label: 'First Name', type: 'text', required: true, group: 'basic' },
  { id: 'lastname', label: 'Last Name', type: 'text', required: true, group: 'basic' },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    validation: emailValidator,
    group: 'basic',
  },
  { id: 'phone_number', label: 'Phone Number', type: 'phone', required: true, group: 'basic' },
  { id: 'note', label: 'Note', type: 'textarea', group: 'note' },
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
