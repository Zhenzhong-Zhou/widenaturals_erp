import { type FC } from 'react';
import type { CustomerSortField } from '../state';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';

interface CustomerSortControlsProps {
  sortBy: CustomerSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: CustomerSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const customerSortOptions: { label: string; value: CustomerSortField }[] = [
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Email', value: 'email' },
  { label: 'Phone Number', value: 'phoneNumber' },
  { label: 'Has Address', value: 'hasAddress' },
  { label: 'Status', value: 'status' },
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Created By', value: 'createdBy' },
  { label: 'Updated By', value: 'updatedBy' },
];

const CustomerSortControls: FC<CustomerSortControlsProps> = ({
                                                               sortBy,
                                                               sortOrder,
                                                               onSortByChange,
                                                               onSortOrderChange,
                                                             }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={customerSortOptions}
      onSortByChange={(val) => onSortByChange(val as CustomerSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default CustomerSortControls;
