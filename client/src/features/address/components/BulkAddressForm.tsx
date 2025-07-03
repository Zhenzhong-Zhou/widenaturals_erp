import type { FC } from 'react';
import MultiItemForm, { type MultiItemFieldConfig } from '@components/common/MultiItemForm';
import { emailValidator } from '@utils/validation';

export interface BulkAddressFormProps {
  onSubmit: (addresses: Record<string, any>[]) => void;
  loading?: boolean;
  customerNames?: string[];  // optional, if you want to use in getItemTitle
}

const addressFields: MultiItemFieldConfig[] = [
  { id: 'label', label: 'Label', type: 'text', required: false, group: 'basic' },
  { id: 'full_name', label: 'Recipient Name', type: 'text', required: true, group: 'basic' },
  { id: 'phone', label: 'Phone Number', type: 'phone', required: true, group: 'basic' },
  { id: 'email', label: 'Email', type: 'email', required: true, validation: emailValidator, group: 'basic' },
  { id: 'address_line1', label: 'Address Line 1', type: 'text', required: true, group: 'address' },
  { id: 'address_line2', label: 'Address Line 2', type: 'text', required: false, group: 'address' },
  { id: 'city', label: 'City', type: 'text', required: true, group: 'address' },
  { id: 'state', label: 'State / Province', type: 'text', required: true, group: 'address' },
  { id: 'postal_code', label: 'Postal Code', type: 'text', required: true, group: 'address', grid: { xs: 12, sm: 4 } },
  { id: 'country', label: 'Country', type: 'text', required: true, group: 'address', grid: { xs: 12, sm: 4 } },
  { id: 'region', label: 'Region', type: 'text', required: true, group: 'address', grid: { xs: 12, sm: 4 } },
  { id: 'note', label: 'Note', type: 'textarea', group: 'note' },
];

const BulkAddressForm: FC<BulkAddressFormProps> = ({ onSubmit, loading, customerNames }) => {
  return (
    <MultiItemForm
      fields={addressFields}
      onSubmit={onSubmit}
      loading={loading}
      validation={() =>
        Object.fromEntries(
          addressFields.filter((f) => f.validation).map((f) => [f.id, f.validation!])
        )
      }
      getItemTitle={(index, item) =>
        item.full_name || customerNames?.[index] || `Address #${index + 1}`
      }
    />
  );
};

export default BulkAddressForm;
