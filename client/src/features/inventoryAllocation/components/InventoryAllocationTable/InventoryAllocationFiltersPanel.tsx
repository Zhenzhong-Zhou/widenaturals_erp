import { type FC, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { InventoryAllocationFilters } from '@features/inventoryAllocation/state';
import Grid from '@mui/material/Grid';
import useWarehouseLookup from '@hooks/useWarehouseLookup';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import type { MultiSelectOption } from '@components/common/MultiSelectDropdown';
import WarehouseMultiSelectDropdown from '@features/lookup/components/WarehouseMultiSelectDropdown';
import BatchRegistryMultiSelectDropdown from '@features/lookup/components/BatchRegistryMultiSelectDropdown';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';
import { toISODate } from '@utils/dateTimeUtils';
import useBatchRegistryLookup from '@hooks/useBatchRegistryLookup';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
} from '@features/lookup/state';
import { mapBatchLookupToOptions } from '@features/lookup/utils/batchRegistryUtils';
import useOrderTypeLookup from '@hooks/useOrderTypeLookup';
import OrderTypeDropdown from '@features/lookup/components/OrderTypesDropdown';
import { formatLabel } from '@utils/textUtils';

interface Props {
  filters: InventoryAllocationFilters;
  onChange: (filters: InventoryAllocationFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: InventoryAllocationFilters = {
  keyword: '',
  statusIds: [],
  warehouseIds: [],
  batchIds: [],
  allocationCreatedBy: '',
  orderNumber: '',
  orderStatusId: '',
  orderTypeId: '',
  orderCreatedBy: '',
  paymentStatusId: '',
  aggregatedAllocatedAfter: '',
  aggregatedAllocatedBefore: '',
  aggregatedCreatedAfter: '',
  aggregatedCreatedBefore: '',
};

const textFields: {
  name: keyof InventoryAllocationFilters;
  label: string;
  placeholder?: string;
}[] = [
  { name: 'orderNumber', label: 'Order Number' },
  {
    name: 'keyword',
    label: 'Search Keyword',
    placeholder: 'Order number, Customer Name, etc.',
  },
  // todo: later need to finished
  // { name: 'statusIds', label: 'Allocation Status IDs' },
  // { name: 'allocationCreatedBy', label: 'Allocation Created By' },
  // { name: 'orderStatusId', label: 'Order Status ID' },
  // { name: 'orderCreatedBy', label: 'Order Created By' },
  // { name: 'paymentStatusId', label: 'Payment Status ID' },
];

const dateFields: { name: keyof InventoryAllocationFilters; label: string }[] =
  [
    { name: 'aggregatedAllocatedAfter', label: 'Allocated After' },
    { name: 'aggregatedAllocatedBefore', label: 'Allocated Before' },
    { name: 'aggregatedCreatedAfter', label: 'Created After' },
    { name: 'aggregatedCreatedBefore', label: 'Created Before' },
  ];

const InventoryAllocationFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset } = useForm<InventoryAllocationFilters>({
    defaultValues: filters,
  });
  const [batchLookupParams, setBatchLookupParams] =
    useState<GetBatchRegistryLookupParams>({
      batchType: '',
      limit: 50,
      offset: 0,
    });

  const {
    items: warehouseItems,
    loading: isWarehouseLoading,
    error: warehouseError,
    fetchLookup: fetchWarehouseLookup,
    resetLookup: resetWarehouseLookup,
  } = useWarehouseLookup();

  const {
    items: batchRegistryOptions,
    loading: isBatchRegistryLoading,
    error: batchRegistryError,
    meta: batchRegistryMeta,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: resetBatchRegistryLookup,
  } = useBatchRegistryLookup();

  const {
    options: orderTypeOptions,
    loading: isOrderTypeLoading,
    error: orderTypeError,
    fetch: fetchOrderTypeLookup,
    reset: resetOrderTypeLookup,
  } = useOrderTypeLookup();

  const warehouseOptions: MultiSelectOption[] = useMemo(() => {
    return warehouseItems.map((w) => ({
      label: w.label,
      value: w.value,
    }));
  }, [warehouseItems]);

  const batchLookupOptions = useMemo(() => {
    return mapBatchLookupToOptions(
      batchRegistryOptions,
      false
    ) as BatchLookupOption[];
  }, [batchRegistryOptions]);

  const formattedOrderTypeOptions = useMemo(() => {
    return orderTypeOptions.map((opt) => ({
      ...opt,
      label: formatLabel(opt.label, { preserveHyphen: true }),
    }));
  }, [orderTypeOptions]);

  const sanitizeFilters = (
    f: InventoryAllocationFilters
  ): InventoryAllocationFilters => ({
    ...f,
    warehouseIds: Array.isArray(f.warehouseIds) ? f.warehouseIds : [],
    statusIds: Array.isArray(f.statusIds) ? f.statusIds : [],
    batchIds: Array.isArray(f.batchIds) ? f.batchIds : [],
  });

  // On mount: fetch and reset warehouse lookup
  useEffect(() => {
    resetWarehouseLookup();
    fetchWarehouseLookup();

    return () => resetWarehouseLookup(); // if fetch could overlap unmount
  }, []);

  // On mount: fetch and reset order type lookup
  useEffect(() => {
    resetOrderTypeLookup();
    fetchOrderTypeLookup();
  }, []);

  // On batch param change: reset and fetch batch registry
  useEffect(() => {
    const timeout = setTimeout(() => {
      resetBatchRegistryLookup();
      fetchBatchRegistryLookup(batchLookupParams);
    }, 200); // 200ms debounce

    return () => clearTimeout(timeout);
  }, [batchLookupParams]);

  useEffect(() => {
    reset(sanitizeFilters(filters));
  }, [filters, reset]);

  const submitFilters = (data: InventoryAllocationFilters) => {
    const adjusted: InventoryAllocationFilters = {
      ...data,
      aggregatedAllocatedBefore: toISODate(data.aggregatedAllocatedBefore),
      aggregatedAllocatedAfter: toISODate(data.aggregatedAllocatedAfter),
      aggregatedCreatedBefore: toISODate(data.aggregatedCreatedBefore),
      aggregatedCreatedAfter: toISODate(data.aggregatedCreatedAfter),
    };

    onChange(adjusted);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit(submitFilters)}>
      <FilterPanelLayout onReset={resetFilters}>
        <>
          {/* -- Dropdowns -- */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {/* Warehouses */}
              <Controller
                name="warehouseIds"
                control={control}
                render={({ field }) => {
                  const selectedOptions = warehouseOptions.filter((option) =>
                    field.value?.includes(option.value)
                  );
                  return (
                    <WarehouseMultiSelectDropdown
                      options={warehouseOptions}
                      selectedOptions={selectedOptions}
                      onChange={(selected) => {
                        field.onChange(selected.map((opt) => opt.value));
                      }}
                      loading={isWarehouseLoading}
                      error={warehouseError}
                      label="Warehouses"
                      placeholder="Select warehouses"
                    />
                  );
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {/* Batches */}
              <Controller
                name="batchIds"
                control={control}
                render={({ field }) => {
                  const selectedOptions = batchLookupOptions.filter((opt) =>
                    field.value?.includes(opt.value)
                  );
                  return (
                    <BatchRegistryMultiSelectDropdown
                      label="Batches"
                      batchLookupOptions={batchLookupOptions}
                      selectedOptions={selectedOptions}
                      onChange={(selected) => {
                        field.onChange(selected.map((opt) => opt.value));
                      }}
                      setFetchParams={setBatchLookupParams}
                      batchLookupMeta={batchRegistryMeta}
                      batchLookupLoading={isBatchRegistryLoading}
                      batchLookupError={batchRegistryError}
                      placeholder="Select batches"
                    />
                  );
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {/* Order Type */}
              <Controller
                name="orderTypeId"
                control={control}
                render={({ field }) => (
                  <OrderTypeDropdown
                    value={field.value ?? null}
                    onChange={field.onChange}
                    orderTypeOptions={formattedOrderTypeOptions}
                    orderTypeLoading={isOrderTypeLoading}
                    orderTypeError={orderTypeError}
                  />
                )}
              />
            </Grid>

            {/* -- Text Fields (widened) -- */}
            {textFields.map(({ name, label, placeholder }) =>
              renderInputField(control, name, label, placeholder)
            )}

            {/* -- Date Fields: group in one row (3 dates in 1 row on lg+) -- */}
            {dateFields.map(({ name, label }) =>
              renderDateField(control, name, label)
            )}
          </Grid>
        </>
      </FilterPanelLayout>
    </form>
  );
};

export default InventoryAllocationFiltersPanel;
