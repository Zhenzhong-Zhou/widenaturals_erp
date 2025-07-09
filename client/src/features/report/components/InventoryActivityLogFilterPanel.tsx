import { type Dispatch, type FC, type SetStateAction } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import BaseInput from '@components/common/BaseInput';
import CustomButton from '@components/common/CustomButton';
import CustomDatePicker from '@components/common/CustomDatePicker';
import type { InventoryActivityLogQueryParams } from '@features/report/state';
import BatchRegistryMultiSelectDropdown from '@features/lookup/components/BatchRegistryMultiSelectDropdown';
import type {
  BatchLookupOption,
  GetBatchRegistryLookupParams,
  LookupOption, LookupPaginationMeta,
  WarehouseOption,
} from '@features/lookup/state';
import type { MultiSelectOption } from '@components/common/MultiSelectDropdown';
import WarehouseMultiSelectDropdown from '@features/lookup/components/WarehouseMultiSelectDropdown';
import LotAdjustmentTypeMultiSelectDropdown from '@features/lookup/components/LotAdjustmentTypeMultiSelectDropdown';

interface InventoryActivityLogFilterPanelProps {
  filters: Partial<InventoryActivityLogQueryParams>;
  onChange: (filters: Partial<InventoryActivityLogQueryParams>) => void;
  onApply: () => void;
  onReset: () => void;
  batchLookupOptions: BatchLookupOption[];
  selectedBatches: BatchLookupOption[];
  onSelectedBatchesChange: (value: BatchLookupOption[]) => void;
  batchLookupParams: GetBatchRegistryLookupParams;
  setBatchLookupParams: Dispatch<
    SetStateAction<GetBatchRegistryLookupParams>
  >;
  fetchBatchLookup: (params: GetBatchRegistryLookupParams) => void;
  batchLookupMeta: LookupPaginationMeta;
  batchLookupLoading?: boolean;
  batchLookupError?: string | null;
  warehouseOptions: WarehouseOption[];
  selectedWarehouses: WarehouseOption[];
  onSelectedWarehousesChange: (value: WarehouseOption[]) => void;
  warehouseLoading?: boolean;
  warehouseError?: string | null;
  lotAdjustmentOptions: LookupOption[]; // list of lot adjustment type options
  selectedLotAdjustments: LookupOption[];
  onSelectedLotAdjustmentsChange: (value: LookupOption[]) => void;
  lotAdjustmentLoading?: boolean;
  lotAdjustmentError?: string | null;
}

const InventoryActivityLogFilterPanel: FC<InventoryActivityLogFilterPanelProps> = ({
                                                                                     filters,
                                                                                     onChange,
                                                                                     onApply,
                                                                                     onReset,
                                                                                     batchLookupOptions,
                                                                                     selectedBatches,
                                                                                     onSelectedBatchesChange,
                                                                                     batchLookupParams,
                                                                                     setBatchLookupParams,
                                                                                     fetchBatchLookup,
                                                                                     batchLookupMeta,
                                                                                     batchLookupLoading,
                                                                                     batchLookupError,
                                                                                     warehouseOptions,
                                                                                     selectedWarehouses,
                                                                                     onSelectedWarehousesChange,
                                                                                     warehouseLoading,
                                                                                     warehouseError,
                                                                                     lotAdjustmentOptions,
                                                                                     selectedLotAdjustments,
                                                                                     onSelectedLotAdjustmentsChange,
                                                                                     lotAdjustmentLoading,
                                                                                     lotAdjustmentError,
                                                                                   }) => {
  const handleChange =
    <K extends keyof InventoryActivityLogQueryParams>(field: K) =>
      (value: InventoryActivityLogQueryParams[K]) => {
        onChange({ ...filters, [field]: value });
      };
  
  const handleBatchDropdownChange = (selected: MultiSelectOption[]) => {
    const newSelected: BatchLookupOption[] = selected.map((opt) => {
      const matched = batchLookupOptions.find((item) => item.value === opt.value);
      return {
        value: opt.value,
        label: opt.label,
        type: matched?.type ?? 'product',
      };
    });
    
    onSelectedBatchesChange(newSelected); // For UI sync
    handleChange('batchIds')(newSelected.map((item) => item.value)); // Update filter for backend
  };
  
  const handleWarehouseDropdownChange = (selected: WarehouseOption[]) => {
    onSelectedWarehousesChange(selected); // Update UI
    
    const selectedWarehouseIds = selected.map((w) => w.value);
    handleChange('warehouseIds')(selectedWarehouseIds); // Update filters
  };
  
  const handleSelectedLotAdjustmentsChange = (selected: LookupOption[]) => {
    const selectedValue = selected[0]?.value ?? '';
    onSelectedLotAdjustmentsChange(selected);
    onChange({
      ...filters,
      adjustmentTypeId: selectedValue,
    });
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {/* Left column */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <BatchRegistryMultiSelectDropdown
            label="Select Batches"
            batchLookupOptions={batchLookupOptions}
            selectedOptions={selectedBatches}
            onChange={handleBatchDropdownChange}
            batchLookupParams={batchLookupParams}
            setFetchParams={setBatchLookupParams}
            fetchBatchLookup={fetchBatchLookup}
            batchLookupMeta={batchLookupMeta}
            batchLookupLoading={batchLookupLoading}
            batchLookupError={batchLookupError}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <WarehouseMultiSelectDropdown
            label="Select Warehouses"
            options={warehouseOptions}
            selectedOptions={selectedWarehouses}
            onChange={handleWarehouseDropdownChange}
            loading={warehouseLoading}
            error={warehouseError}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <LotAdjustmentTypeMultiSelectDropdown
            label="Adjustment Types"
            options={lotAdjustmentOptions}
            selectedOptions={selectedLotAdjustments}
            onChange={handleSelectedLotAdjustmentsChange}
            loading={lotAdjustmentLoading}
            error={lotAdjustmentError}
            placeholder="Select adjustment types"
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <BaseInput
            label="Performed By"
            fullWidth
            value={filters.performedBy ?? ''}
            onChange={(e) => handleChange('performedBy')(e.target.value)}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <BaseInput
            label="Order ID"
            fullWidth
            value={filters.orderId ?? ''}
            onChange={(e) => handleChange('orderId')(e.target.value)}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <BaseInput
            label="Source Type"
            fullWidth
            value={filters.sourceType ?? ''}
            onChange={(e) => handleChange('sourceType')(e.target.value)}
          />
        </Grid>
        
        {/* Dates */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CustomDatePicker
            label="From Date"
            value={filters.fromDate ?? null}
            onChange={(date) => handleChange('fromDate')(date?.toISOString() ?? null)}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <CustomDatePicker
            label="To Date"
            value={filters.toDate ?? null}
            onChange={(date) => handleChange('toDate')(date?.toISOString() ?? null)}
          />
        </Grid>
        
        {/* Action + Reset */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Box display="flex" gap={1}>
            <CustomButton variant="contained" onClick={onApply}>
              Apply
            </CustomButton>
            {onReset && (
              <CustomButton variant="outlined" onClick={onReset}>
                Reset
              </CustomButton>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryActivityLogFilterPanel;
