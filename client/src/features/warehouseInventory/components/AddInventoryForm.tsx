import {
  type Dispatch,
  type FC,
  type SetStateAction,
  useMemo,
  useState,
} from 'react';
import CustomForm, { type FieldConfig } from '@components/common/CustomForm';
import BatchRegistryDropdown from '@features/lookup/components/BatchRegistryDropdown';
import WarehouseDropdown from '@features/lookup/components/WarehouseDropdown';
import CustomDatePicker from '@components/common/CustomDatePicker';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
  LookupPaginationMeta,
} from '@features/lookup/state';
import { useBatchTypeHandler } from '@features/warehouseInventory/hooks/useBatchTypeHandler.ts';
import { getVisibleBatchOptions } from '@features/warehouseInventory/utils/getVisibleBatchOptions.ts';
import type { BatchType } from '@features/inventoryShared/types/InventorySharedType.ts';

interface AddInventoryFormProps {
  onSubmit: (formData: Record<string, any>) => void;
  loading?: boolean;
  batchLookupOptions: BatchLookupOption[];
  selectedBatch: { id: string; type: string } | null;
  setSelectedBatch: (value: { id: string; type: string } | null) => void;
  batchLookupParams: GetBatchRegistryLookupParams;
  setBatchLookupParams: Dispatch<
    SetStateAction<GetBatchRegistryLookupParams>
  >;
  fetchBatchLookup: (params: GetBatchRegistryLookupParams) => void;
  resetBatchLookup: () => void;
  batchLookupPaginationMeta: LookupPaginationMeta;
  batchLookupLoading?: boolean;
  batchLookupError?: string | null;
  warehouseLookupOptions: { value: string; label: string }[];
  selectedWarehouse: { warehouseId: string; locationId: string } | null;
  setSelectedWarehouse: (
    w: { warehouseId: string; locationId: string } | null
  ) => void;
  fetchWarehouseLookup: (filters?: { warehouseTypeId?: string }) => void;
  warehouseLookupLoading?: boolean;
  warehouseLookupError?: string | null;
}

const AddInventoryForm: FC<AddInventoryFormProps> = ({
  onSubmit,
  loading,
  batchLookupOptions,
  selectedBatch,
  setSelectedBatch,
  batchLookupParams,
  setBatchLookupParams,
  fetchBatchLookup,
  resetBatchLookup,
  batchLookupPaginationMeta,
  batchLookupLoading,
  batchLookupError,
  warehouseLookupOptions,
  selectedWarehouse,
  setSelectedWarehouse,
  fetchWarehouseLookup,
  warehouseLookupLoading,
  warehouseLookupError,
}) => {
  const [batchType, setBatchType] = useState<BatchType>('all');
  
  const visibleOptions = getVisibleBatchOptions(batchType, batchLookupOptions);
  
  const { handleBatchTypeChange } = useBatchTypeHandler({
    setBatchType,
    setBatchLookupParams,
    resetBatchLookup,
    fetchBatchLookup,
  });
  
  const fields: FieldConfig[] = useMemo(() => {
    const baseFields: FieldConfig[] = [
      {
        id: 'warehouse_id',
        label: 'Warehouse',
        type: 'custom',
        required: true,
        grid: { xs: 12 },
        customRender: ({ value, onChange }) => {
          return (
            <WarehouseDropdown
              value={value ?? null}
              onChange={(val) => {
                if (!val || !val.includes('::')) {
                  setSelectedWarehouse(null);
                  onChange?.('');
                  return;
                }
                const [warehouseId, locationId] = val.split('::');
                if (!warehouseId || !locationId) {
                  setSelectedWarehouse(null);
                  onChange?.('');
                  return;
                }
                setSelectedWarehouse({ warehouseId, locationId });
                onChange?.(`${warehouseId}::${locationId}`);

                setBatchLookupParams((prev) => ({
                  ...prev,
                  warehouseId,
                  locationId,
                }));
              }}
              warehouseLookupOptions={warehouseLookupOptions}
              warehouseLookupLoading={warehouseLookupLoading}
              warehouseLookupError={warehouseLookupError}
              onRefresh={() => fetchWarehouseLookup({})}
            />
          );
        },
      },
    ];

    if (!selectedWarehouse) return baseFields;

    return [
      ...baseFields,
      {
        id: 'batch_id',
        label: 'Batch',
        type: 'custom',
        required: true,
        grid: { xs: 12 },
        customRender: ({ onChange }) => (
          <Grid container spacing={2}>
            <Grid size={{xs: 12}}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Batch Type</FormLabel>
                <RadioGroup
                  row
                  name="batchType"
                  value={batchType}
                  onChange={handleBatchTypeChange}
                >
                  <FormControlLabel value="all" control={<Radio />} label="All" />
                  <FormControlLabel value="product" control={<Radio />} label="Product" />
                  <FormControlLabel value="packaging_material" control={<Radio />} label="Packaging" />
                </RadioGroup>
              </FormControl>
            </Grid>
            
            <Grid size={{xs: 12}}>
              <BatchRegistryDropdown
                value={
                  selectedBatch ? `${selectedBatch.id}::${selectedBatch.type}` : null
                }
                options={visibleOptions}
                onChange={(val) => {
                  if (!val || !val.includes('::')) {
                    setSelectedBatch(null);
                    return;
                  }
                  const [id, type] = val.split('::');
                  if (!id || !type) {
                    setSelectedBatch(null);
                    return;
                  }
                  setSelectedBatch({ id, type });
                  onChange?.(`${id}::${type}`);
                }}
                loading={batchLookupLoading}
                error={batchLookupError}
                paginationMeta={batchLookupPaginationMeta}
                fetchParams={{
                  ...batchLookupParams,
                  warehouseId: selectedWarehouse.warehouseId,
                  locationId: selectedWarehouse.locationId,
                }}
                setFetchParams={setBatchLookupParams}
                onRefresh={fetchBatchLookup}
                noOptionsMessage={
                   visibleOptions.length === 0
                      ? 'No matching batches found' : ''
                }
              />
            </Grid>
          </Grid>
        ),
      },
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        grid: { xs: 12, sm: 6 },
        min: 1,
      },
      {
        id: 'inbound_date',
        label: 'Inbound Date',
        type: 'custom',
        required: true,
        grid: { xs: 12, sm: 6 },
        customRender: ({ value, onChange }) => (
          <CustomDatePicker
            label="Inbound Date"
            value={value && !isNaN(Date.parse(value)) ? new Date(value) : null}
            onChange={(date: Date | null) => {
              const isoString = date ? date.toISOString() : '';
              onChange?.(isoString);
            }}
            required={true}
          />
        ),
      },
      {
        id: 'comments',
        label: 'Comments',
        type: 'textarea',
        grid: { xs: 12 },
      },
    ];
  }, [
    selectedWarehouse,
    batchType,
    selectedBatch,
    warehouseLookupOptions,
    warehouseLookupLoading,
    warehouseLookupError,
    fetchWarehouseLookup,
    batchLookupOptions,
    batchLookupError,
    batchLookupLoading,
    batchLookupPaginationMeta,
    batchLookupParams,
    setBatchLookupParams,
    fetchBatchLookup,
    setSelectedWarehouse,
    setSelectedBatch,
  ]);

  return (
    <CustomForm
      fields={fields}
      onSubmit={onSubmit}
      submitButtonLabel={loading ? 'Saving...' : 'Save'}
      showSubmitButton
    ></CustomForm>
  );
};

export default AddInventoryForm;
