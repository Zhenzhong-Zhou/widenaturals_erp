import { useForm } from 'react-hook-form';
import { type FC } from 'react';
import type { LocationInventoryFilters } from '@features/locationInventory/state';
import BaseInventoryFilterPanel, {
  type InventoryFilterFieldConfig,
} from '@features/inventoryShared/components/BaseInventoryFilterPanel';

const DEFAULT_LOCATION_INVENTORY_FILTERS: LocationInventoryFilters = {
  batchType: undefined,
  locationName: '',
  productName: '',
  sku: '',
  materialName: '',
  materialCode: '',
  partName: '',
  partCode: '',
  partType: '',
  lotNumber: '',
  status: '',
  inboundAfter: undefined,
  inboundBefore: undefined,
  expiryAfter: undefined,
  expiryBefore: undefined,
  createdAfter: undefined,
  createdBefore: undefined,
};

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
  { name: 'locationName', label: 'Location Name' },
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

const LocationInventoryFilterPanel: FC<{
  initialFilters?: LocationInventoryFilters;
  onApply: (filters: LocationInventoryFilters) => void;
  onReset?: () => void;
  visibleFields?: (keyof LocationInventoryFilters)[];
  showActionsWhenAll?: boolean;
  requireBatchTypeForActions?: boolean;
}> = ({
        initialFilters,
        ...rest
      }) => {
  const resolvedInitialFilters = initialFilters ?? DEFAULT_LOCATION_INVENTORY_FILTERS;
  
  const { control, handleSubmit, reset, watch } =
    useForm<LocationInventoryFilters>({
      defaultValues: resolvedInitialFilters,
    });

  return (
    <BaseInventoryFilterPanel
      {...rest}
      initialFilters={resolvedInitialFilters}
      control={control}
      handleSubmit={handleSubmit}
      reset={reset}
      watch={watch}
      fields={fields}
    />
  );
};

export default LocationInventoryFilterPanel;
