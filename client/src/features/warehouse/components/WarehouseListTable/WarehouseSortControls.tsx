import { type FC } from 'react';
import SortControls from '@components/common/SortControls';
import type { SortOrder } from '@shared-types/api';
import type { WarehouseSortField } from '@features/warehouse';

interface WarehouseSortControlsProps {
  sortBy: WarehouseSortField | '';
  sortOrder: SortOrder;
  onSortByChange: (value: WarehouseSortField) => void;
  onSortOrderChange: (value: SortOrder) => void;
}

const warehouseSortOptions: { label: string; value: WarehouseSortField }[] = [
  // ── Warehouse fields ──────────────────────────────────────────
  { label: 'Name',             value: 'warehouseName' },
  { label: 'Code',             value: 'warehouseCode' },
  { label: 'Storage Capacity', value: 'storageCapacity' },
  { label: 'Default Fee',      value: 'defaultFee' },
  
  // ── Type & location ───────────────────────────────────────────
  { label: 'Warehouse Type',   value: 'warehouseTypeName' },
  { label: 'Location',         value: 'locationName' },
  { label: 'City',             value: 'city' },
  { label: 'Province / State', value: 'provinceOrState' },
  { label: 'Country',          value: 'country' },
  
  // ── Status ────────────────────────────────────────────────────
  { label: 'Status',           value: 'statusName' },
  { label: 'Status Date',      value: 'statusDate' },
  
  // ── Inventory summary ─────────────────────────────────────────
  { label: 'Total Quantity',   value: 'totalQuantity' },
  
  // ── Audit ─────────────────────────────────────────────────────
  { label: 'Created At',       value: 'createdAt' },
  { label: 'Updated At',       value: 'updatedAt' },
  
  // ── Default ───────────────────────────────────────────────────
  { label: 'Default (Natural Sort)', value: 'defaultNaturalSort' },
];

const WarehouseSortControls: FC<WarehouseSortControlsProps> = ({
                                                                 sortBy,
                                                                 sortOrder,
                                                                 onSortByChange,
                                                                 onSortOrderChange,
                                                               }) => {
  return (
    <SortControls
      sortBy={sortBy}
      sortOrder={sortOrder}
      sortOptions={warehouseSortOptions}
      onSortByChange={(val) => onSortByChange(val as WarehouseSortField)}
      onSortOrderChange={onSortOrderChange}
    />
  );
};

export default WarehouseSortControls;
