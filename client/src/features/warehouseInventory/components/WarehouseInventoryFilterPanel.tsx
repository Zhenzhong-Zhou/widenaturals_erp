import { useForm } from 'react-hook-form';
import { type FC } from 'react';
import type { WarehouseInventoryFilters } from '@features/warehouseInventory/state';
import BaseInventoryFilterPanel, {
  type InventoryFilterFieldConfig,
} from '@features/inventoryShared/components/BaseInventoryFilterPanel';

const fields: InventoryFilterFieldConfig[] = [
  {
    name: 'batchType',
    label: 'Batch Type',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Product', value: 'product' },
      { label: 'Packaging Material', value: 'packaging_material' },
    ],
  },
  { name: 'warehouseName', label: 'Warehouse Name' },
  { name: 'productName', label: 'Product Name' },
  { name: 'sku', label: 'SKU' },
  { name: 'materialName', label: 'Material Name' },
  { name: 'materialCode', label: 'Material Code' },
  { name: 'partName', label: 'Part Name' },
  { name: 'partCode', label: 'Part Code' },
  { name: 'partType', label: 'Part Type' },
  { name: 'lotNumber', label: 'Lot Number' },
  { name: 'status', label: 'Status' },
  { name: 'inboundDate', label: 'Inbound Date', type: 'date' },
  { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
  { name: 'createdAt', label: 'Created At', type: 'date' },
];

const WarehouseInventoryFilterPanel: FC<{
  initialFilters?: WarehouseInventoryFilters;
  onApply: (filters: WarehouseInventoryFilters) => void;
  onReset?: () => void;
  visibleFields?: (keyof WarehouseInventoryFilters)[];
  showActionsWhenAll?: boolean;
}> = (props) => {
  const { control, handleSubmit, reset, watch } = useForm<WarehouseInventoryFilters>({
    defaultValues: {
      ...props.initialFilters,
      batchType: undefined,
    },
  });
  
  return (
    <BaseInventoryFilterPanel
      {...props}
      control={control}
      handleSubmit={handleSubmit}
      reset={reset}
      watch={watch}
      fields={fields}
    />
  );
};

export default WarehouseInventoryFilterPanel;
