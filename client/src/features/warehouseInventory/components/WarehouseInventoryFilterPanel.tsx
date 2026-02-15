import { type FC, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import type { WarehouseInventoryFilters } from '@features/warehouseInventory/state';
import BaseInventoryFilterPanel, {
  type InventoryFilterFieldConfig,
} from '@features/inventoryShared/components/BaseInventoryFilterPanel';

const EMPTY_FILTERS: WarehouseInventoryFilters = Object.freeze({
  batchType: undefined,
  warehouseName: undefined,
  productName: undefined,
  sku: undefined,
  materialName: undefined,
  materialCode: undefined,
  partName: undefined,
  partCode: undefined,
  partType: undefined,
  lotNumber: undefined,
  status: undefined,
  inboundAfter: undefined,
  inboundBefore: undefined,
  expiryAfter: undefined,
  expiryBefore: undefined,
  createdAfter: undefined,
  createdBefore: undefined,
});

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
  { name: 'inboundAfter', label: 'Inbound After', type: 'date' },
  { name: 'inboundBefore', label: 'Inbound Before', type: 'date' },
  { name: 'expiryAfter', label: 'Expiry After', type: 'date' },
  { name: 'expiryBefore', label: 'Expiry Before', type: 'date' },
  { name: 'createdAfter', label: 'Created After', type: 'date' },
  { name: 'createdBefore', label: 'Created Before', type: 'date' },
];

const WarehouseInventoryFilterPanel: FC<{
  initialFilters?: WarehouseInventoryFilters;
  onApply: (filters: WarehouseInventoryFilters) => void;
  onReset?: () => void;
  visibleFields?: (keyof WarehouseInventoryFilters)[];
  showActionsWhenAll?: boolean;
}> = (props) => {
  const normalizedInitialFilters = useMemo(
    () => props.initialFilters ?? EMPTY_FILTERS,
    [props.initialFilters]
  );

  const { control, handleSubmit, reset, watch } =
    useForm<WarehouseInventoryFilters>({
      defaultValues: normalizedInitialFilters,
      shouldUnregister: true,
    });

  return (
    <BaseInventoryFilterPanel
      {...props}
      initialFilters={normalizedInitialFilters}
      control={control}
      handleSubmit={handleSubmit}
      reset={reset}
      watch={watch}
      fields={fields}
    />
  );
};

export default WarehouseInventoryFilterPanel;
