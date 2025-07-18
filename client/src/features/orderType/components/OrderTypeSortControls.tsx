import { type FC } from 'react';
import type { OrderTypeSortBy } from '@features/orderType/state';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';

interface OrderTypeSortControlsProps {
  sortBy: string;
  sortOrder: SortOrder;
  onSortByChange: (value: OrderTypeSortBy) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const sortOptions: { label: string; value: OrderTypeSortBy }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Code', value: 'code' },
  { label: 'Category', value: 'category' },
  { label: 'Requires Payment', value: 'requiresPayment' },
  { label: 'Description', value: 'description' },
  { label: 'Status Name', value: 'statusName' },
  { label: 'Status Date', value: 'statusDate' },
  { label: 'Created At', value: 'createdAt' },
  { label: 'Updated At', value: 'updatedAt' },
  { label: 'Created By', value: 'createdBy' },
  { label: 'Updated By', value: 'updatedBy' },
  { label: 'Default', value: 'defaultNaturalSort' },
];

const OrderTypeSortControls: FC<OrderTypeSortControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
}) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortByChange={(val) => onSortByChange(val as OrderTypeSortBy)}
      onSortOrderChange={onSortOrderChange}
      sortOptions={sortOptions}
    />
  );
};

export default OrderTypeSortControls;
