import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { WarehouseInventorySortField } from '@features/warehouseInventory';

interface WarehouseInventorySortControlsProps {
  sortBy: WarehouseInventorySortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: WarehouseInventorySortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const warehouseInventorySortOptions: { label: string; value: WarehouseInventorySortField }[] = [
  // ---- Product / item fields ----
  { label: 'Product Name',   value: 'productName' },
  { label: 'SKU',            value: 'sku' },
  
  // ---- Quantity fields ----
  { label: 'On-Hand Qty',    value: 'warehouseQuantity' },
  { label: 'Reserved Qty',   value: 'reservedQuantity' },
  { label: 'Available Qty',  value: 'availableQuantity' },
  
  // ---- Fee ----
  { label: 'Warehouse Fee',  value: 'warehouseFee' },
  
  // ---- Date fields ----
  { label: 'Inbound Date',   value: 'inboundDate' },
  { label: 'Outbound Date',  value: 'outboundDate' },
  
  // ---- Status fields ----
  { label: 'Status',         value: 'statusName' },
  
  // ---- Default natural sort ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const WarehouseInventorySortControls: FC<WarehouseInventorySortControlsProps> = ({
                                                                                   sortBy,
                                                                                   sortOrder,
                                                                                   onSortByChange,
                                                                                   onSortOrderChange,
                                                                                 }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={warehouseInventorySortOptions}
      onSortByChange={(val) => onSortByChange(val as WarehouseInventorySortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default WarehouseInventorySortControls;
