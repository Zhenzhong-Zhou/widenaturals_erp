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
  { label: 'Order Status Date', value: 'orderStatusDate' },
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Customer First Name', value: 'customerFirstName' },
  { label: 'Customer Last Name', value: 'customerLastName' },
  { label: 'Payment Method', value: 'paymentMethod' },
  { label: 'Payment Status', value: 'paymentStatus' },
  { label: 'Delivery Method', value: 'deliveryMethod' },
  { label: 'Order Created At', value: 'orderCreatedAt' },
  { label: 'Order Created By (First)', value: 'orderCreatedByFirstName' },
  { label: 'Order Created By (Last)', value: 'orderCreatedByLastName' },
  { label: 'Order Updated At', value: 'orderUpdatedAt' },
  { label: 'Order Updated By (First)', value: 'orderUpdatedByFirstName' },
  { label: 'Order Updated By (Last)', value: 'orderUpdatedByLastName' },
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
