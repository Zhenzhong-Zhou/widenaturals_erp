import {
  type ChangeEvent,
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
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
  GetWarehouseLookupFilters,
} from '@features/lookup/state';

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
  hasMore: boolean;
  pagination?: { limit: number; offset: number };
  batchLookupLoading?: boolean;
  batchLookupError?: string | null;
  warehouseLookupOptions: { value: string; label: string }[];
  selectedWarehouse: { warehouseId: string; locationId: string } | null;
  setSelectedWarehouse: (
    w: { warehouseId: string; locationId: string } | null
  ) => void;
  fetchWarehouseLookup: (params: GetWarehouseLookupFilters) => void;
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
  hasMore,
  pagination,
  batchLookupLoading,
  batchLookupError,
  warehouseLookupOptions,
  selectedWarehouse,
  setSelectedWarehouse,
  fetchWarehouseLookup,
  warehouseLookupLoading,
  warehouseLookupError,
}) => {
  const [batchType, setBatchType] = useState<
    'product' | 'packaging_material' | 'all'
  >('all');

  const handleBatchTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as
      | 'product'
      | 'packaging_material'
      | 'all';
    setBatchType(value);
    setBatchLookupParams((prev: GetBatchRegistryLookupParams) => ({
      ...prev,
      batchType: value === 'all' ? undefined : value,
    }));
  };

  const fields: FieldConfig[] = useMemo(() => {
    const baseFields: FieldConfig[] = [
      {
        id: 'warehouse_id',
        label: 'Warehouse',
        type: 'custom',
        required: true,
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
        customRender: ({ onChange }) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Batch Type</FormLabel>
              <RadioGroup
                row
                name="batchType"
                value={batchType}
                onChange={handleBatchTypeChange}
              >
                <FormControlLabel value="all" control={<Radio />} label="All" />
                <FormControlLabel
                  value="product"
                  control={<Radio />}
                  label="Product"
                />
                <FormControlLabel
                  value="packaging_material"
                  control={<Radio />}
                  label="Packaging"
                />
              </RadioGroup>
            </FormControl>

            <BatchRegistryDropdown
              value={
                selectedBatch
                  ? `${selectedBatch.id}::${selectedBatch.type}`
                  : null
              }
              options={batchLookupOptions}
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
              hasMore={hasMore}
              pagination={pagination}
              fetchParams={{
                ...batchLookupParams,
                warehouseId: selectedWarehouse.warehouseId,
                locationId: selectedWarehouse.locationId,
              }}
              setFetchParams={setBatchLookupParams}
              onRefresh={fetchBatchLookup}
            />
          </Box>
        ),
      },
      {
        id: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        min: 1,
      },
      {
        id: 'inbound_date',
        label: 'Inbound Date',
        type: 'custom',
        required: true,
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
    hasMore,
    pagination,
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
