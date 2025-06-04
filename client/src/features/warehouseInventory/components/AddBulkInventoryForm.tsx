import { useMemo, useState, type ChangeEvent, type Dispatch, type FC, type SetStateAction } from 'react';
import MultiItemForm, { type MultiItemFieldConfig } from '@components/common/MultiItemForm';
import WarehouseDropdown from '@features/dropdown/components/WarehouseDropdown';
import BatchRegistryDropdown from '@features/dropdown/components/BatchRegistryDropdown';
import CustomDatePicker from '@components/common/CustomDatePicker';
import Grid from '@mui/material/Grid';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import type { GetBatchRegistryDropdownParams, GetWarehouseDropdownFilters } from '@features/dropdown/state';

interface AddBulkInventoryFormProps {
  onSubmit: (formData: Record<string, any>) => void;
  loading?: boolean;
  batchDropdownOptions: { value: string; label: string }[];
  batchDropdownParams: GetBatchRegistryDropdownParams;
  setBatchDropdownParams: Dispatch<SetStateAction<GetBatchRegistryDropdownParams>>;
  fetchBatchDropdown: (params: GetBatchRegistryDropdownParams) => void;
  hasMore: boolean;
  pagination?: { limit: number; offset: number };
  batchDropdownLoading?: boolean;
  batchDropdownError?: string | null;
  warehouseDropdownOptions: { value: string; label: string }[];
  selectedWarehouse: { warehouseId: string; locationId: string } | null;
  setSelectedWarehouse: (w: { warehouseId: string; locationId: string } | null) => void;
  fetchWarehouseDropdown: (params: GetWarehouseDropdownFilters) => void;
  warehouseDropdownLoading?: boolean;
  warehouseDropdownError?: string | null;
}

const AddBulkInventoryForm: FC<AddBulkInventoryFormProps> = ({
                                                               onSubmit,
                                                               loading,
                                                               batchDropdownOptions,
                                                               batchDropdownParams,
                                                               setBatchDropdownParams,
                                                               fetchBatchDropdown,
                                                               hasMore,
                                                               pagination,
                                                               batchDropdownLoading,
                                                               batchDropdownError,
                                                               warehouseDropdownOptions,
                                                               selectedWarehouse,
                                                               setSelectedWarehouse,
                                                               fetchWarehouseDropdown,
                                                               warehouseDropdownLoading,
                                                               warehouseDropdownError,
                                                             }) => {
  const [batchType, setBatchType] = useState<'product' | 'packaging_material' | 'all'>('all');
  
  const handleBatchTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'product' | 'packaging_material' | 'all';
    setBatchType(value);
    setBatchDropdownParams((prev: GetBatchRegistryDropdownParams) => ({
      ...prev,
      batchType: value === 'all' ? undefined : value,
    }));
  };
  
  const fields: MultiItemFieldConfig[] = useMemo(() => {
    const baseFields: MultiItemFieldConfig[] = [
      {
        id: 'warehouse_id',
        label: 'Warehouse',
        type: 'custom',
        required: true,
        component: ({ value, onChange, disabled }) => (
          <WarehouseDropdown
            value={value ?? null}
            onChange={(val) => {
              if (!val || !val.includes('::')) {
                setSelectedWarehouse(null);
                onChange('');
                return;
              }
              const [warehouseId, locationId] = val.split('::');
              if (!warehouseId || !locationId) {
                setSelectedWarehouse(null);
                onChange('');
                return;
              }
              setSelectedWarehouse({ warehouseId, locationId });
              onChange(`${warehouseId}::${locationId}`);
              
              setBatchDropdownParams((prev) => ({
                ...prev,
                warehouseId,
                locationId,
              }));
            }}
            warehouseDropdownOptions={warehouseDropdownOptions}
            warehouseDropdownLoading={warehouseDropdownLoading}
            warehouseDropdownError={warehouseDropdownError}
            onRefresh={fetchWarehouseDropdown}
            disabled={disabled}
          />
        ),
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
        group: 'batch',
        component: ({ value, onChange }) => (
          <Grid container spacing={2}>
            {/* Left: Batch Type RadioGroup */}
            <Grid size={{xs:12, sm:6}}>
              <FormControl component="fieldset" fullWidth>
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
            
            {/* Right: Batch Registry Dropdown */}
            <Grid size={{xs:12, sm:6}}>
              <BatchRegistryDropdown
                value={value || null}
                options={batchDropdownOptions}
                onChange={(val) => {
                  onChange(val ?? '');
                }}
                loading={batchDropdownLoading}
                error={batchDropdownError}
                hasMore={hasMore}
                pagination={pagination}
                fetchParams={{
                  ...batchDropdownParams,
                  warehouseId: selectedWarehouse?.warehouseId,
                  locationId: selectedWarehouse?.locationId,
                }}
                setFetchParams={setBatchDropdownParams}
                onRefresh={fetchBatchDropdown}
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
        group: 'qty_date',
        validation: (val) => (val > 0 ? undefined : 'Must be greater than 0'),
      },
      {
        id: 'inbound_date',
        label: 'Inbound Date',
        type: 'custom',
        required: true,
        group: 'qty_date',
        component: ({ value, onChange, disabled, error }) => (
          <CustomDatePicker
            label="Inbound Date"
            value={value && !isNaN(Date.parse(value)) ? new Date(value) : null}
            onChange={(date: Date | null) => {
              const isoString = date ? date.toISOString() : '';
              onChange(isoString);
            }}
            disabled={disabled}
            helperText={error}
            error={!!error}
          />
        ),
      },
      {
        id: 'comments',
        label: 'Comments',
        type: 'text',
      },
    ];
  }, [
    selectedWarehouse,
    batchType,
    warehouseDropdownOptions,
    warehouseDropdownLoading,
    warehouseDropdownError,
    fetchWarehouseDropdown,
    batchDropdownOptions,
    batchDropdownError,
    batchDropdownLoading,
    hasMore,
    pagination,
    batchDropdownParams,
    setBatchDropdownParams,
    fetchBatchDropdown,
    setSelectedWarehouse,
  ]);
  
  return (
    <MultiItemForm
      fields={fields}
      onSubmit={onSubmit}
      validation={() =>
        Object.fromEntries(
          fields
            .filter((f) => f.validation)
            .map((f) => [f.id, f.validation!])
        )
      }
      loading={loading}
    />
  );
};

export default AddBulkInventoryForm;
