import { type FC } from 'react';
import type { InventoryAllocationSortField } from '@features/inventoryAllocation/state';
import type { SortOrder } from '@shared-types/api';
import SortControls from '@components/common/SortControls';

interface InventoryAllocationSortControlsProps {
  sortBy: InventoryAllocationSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: InventoryAllocationSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const inventoryAllocationSortOptions: {
  label: string;
  value: InventoryAllocationSortField;
}[] = [
  { label: 'Order Number', value: 'orderNumber' },
  { label: 'Order Date', value: 'orderDate' },
  { label: 'Order Type', value: 'orderType' },
  { label: 'Order Status', value: 'orderStatus' },
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Customer First Name', value: 'customerFirstname' },
  { label: 'Customer Last Name', value: 'customerLastname' },
  { label: 'Customer Company Name', value: 'customerCompanyName' },
  { label: 'Payment Method', value: 'paymentMethod' },
  { label: 'Payment Status', value: 'paymentStatus' },
  { label: 'Delivery Method', value: 'deliveryMethod' },
  { label: 'Created By (First)', value: 'createdByFirstname' },
  { label: 'Created By (Last)', value: 'createdByLastname' },
  { label: 'Updated By (First)', value: 'updatedByFirstname' },
  { label: 'Updated By (Last)', value: 'updatedByLastname' },
  { label: 'Allocated At', value: 'allocatedAt' },
  { label: 'Allocated Created At', value: 'allocatedCreatedAt' },
  { label: 'Total Items', value: 'totalItems' },
  { label: 'Allocated Items', value: 'allocatedItems' },
  { label: 'Warehouse Names', value: 'warehouseNames' },
  { label: 'Allocation Status', value: 'allocationStatus' },
  { label: 'Allocation Statuses', value: 'allocationStatuses' },
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const InventoryAllocationSortControls: FC<
  InventoryAllocationSortControlsProps
> = ({ sortBy, sortOrder, onSortByChange, onSortOrderChange }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={inventoryAllocationSortOptions}
      onSortByChange={(val) =>
        onSortByChange(val as InventoryAllocationSortField)
      }
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default InventoryAllocationSortControls;
