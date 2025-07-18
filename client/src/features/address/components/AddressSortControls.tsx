import { type FC } from 'react';
import type { AddressSortField } from '../state';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';

interface AddressSortControlsProps {
  sortBy: string;
  sortOrder: SortOrder;
  onSortByChange: (value: AddressSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const sortOptions: { label: string; value: AddressSortField }[] = [
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'City', value: 'city' },
  { label: 'State', value: 'state' },
  { label: 'Postal Code', value: 'postalCode' },
  { label: 'Country', value: 'country' },
  { label: 'Region', value: 'region' },
  { label: 'Label', value: 'label' },
  { label: 'Recipient Name', value: 'recipientName' },
  { label: 'Email', value: 'email' },
  { label: 'Phone', value: 'phone' },
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Customer Email', value: 'customerEmail' },
];

const AddressSortControls: FC<AddressSortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortByChange={(value) => onSortByChange(value as AddressSortField)}
      onSortOrderChange={onSortOrderChange}
      sortOptions={sortOptions}
    />
  );
};

export default AddressSortControls;
