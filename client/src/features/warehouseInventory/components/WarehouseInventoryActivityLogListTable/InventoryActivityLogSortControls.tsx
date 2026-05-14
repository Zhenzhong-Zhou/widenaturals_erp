import { type FC } from 'react';
import type { SortOrder } from '@shared-types/api';
import { InventoryActivityLogSortField } from '@features/warehouseInventory';
import { SortControls } from '@components/index';

interface InventoryActivityLogSortControlsProps {
  sortBy: InventoryActivityLogSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: InventoryActivityLogSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const inventoryActivityLogSortOptions: {
  label: string;
  value: InventoryActivityLogSortField;
}[] = [
  // ---- Date / activity fields ----
  { label: 'Performed At', value: 'performedAt' },
  
  // ---- Action fields ----
  { label: 'Action Type', value: 'actionTypeName' },
  { label: 'Reference Type', value: 'referenceType' },
  
  // ---- Quantity fields ----
  { label: 'Quantity Change', value: 'quantityChange' },
  { label: 'New Quantity', value: 'newQuantity' },
  
  // ---- Default natural sort ----
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const InventoryActivityLogSortControls: FC<
  InventoryActivityLogSortControlsProps
> = ({ sortBy, sortOrder, onSortByChange, onSortOrderChange }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={inventoryActivityLogSortOptions}
      onSortByChange={(val) =>
        onSortByChange(val as InventoryActivityLogSortField)
      }
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default InventoryActivityLogSortControls;
