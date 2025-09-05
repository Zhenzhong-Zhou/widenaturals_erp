import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomButton from '@components/common/CustomButton';
import type { InventoryAllocationFilters } from '@features/inventoryAllocation/state';
import {
  renderInputField,
  renderDateField,
} from '@utils/filters/filterUtils';

interface Props {
  filters: InventoryAllocationFilters;
  onChange: (filters: InventoryAllocationFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: InventoryAllocationFilters = {
  keyword: '',
  statusId: '',
  warehouseId: '',
  batchId: '',
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
  { name: 'keyword', label: 'Search Keyword', placeholder: 'Order number, SKU, etc.' },
  { name: 'statusId', label: 'Allocation Status ID' },
  { name: 'warehouseId', label: 'Warehouse ID' },
  { name: 'batchId', label: 'Batch ID' },
  { name: 'allocationCreatedBy', label: 'Allocation Created By' },
  { name: 'orderStatusId', label: 'Order Status ID' },
  { name: 'orderTypeId', label: 'Order Type ID' },
  { name: 'orderCreatedBy', label: 'Order Created By' },
  { name: 'paymentStatusId', label: 'Payment Status ID' },
];

const dateFields: { name: keyof InventoryAllocationFilters; label: string }[] = [
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
  
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  const submitFilters = (data: InventoryAllocationFilters) => {
    onChange(data);
    onApply();
  };
  
  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };
  
  return (
    <Box mb={2} p={2} border="1px solid #ccc" borderRadius={2}>
      <form onSubmit={handleSubmit(submitFilters)}>
        <Grid container spacing={2} sx={{ minHeight: 160 }}>
          {textFields.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}
          {dateFields.map(({ name, label }) =>
            renderDateField(control, name, label)
          )}
        </Grid>
        
        <Box display="flex" flexWrap="wrap" gap={2} mt={3}>
          <CustomButton type="submit" variant="contained">
            Apply
          </CustomButton>
          <CustomButton variant="outlined" onClick={resetFilters}>
            Reset
          </CustomButton>
        </Box>
      </form>
    </Box>
  );
};

export default InventoryAllocationFiltersPanel;
