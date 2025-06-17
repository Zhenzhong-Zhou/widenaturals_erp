import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import BaseInput from '@components/common/BaseInput';
import CustomButton from '@components/common/CustomButton';
import CustomDatePicker from '@components/common/CustomDatePicker';
import type { InventoryActivityLogQueryParams } from '@features/report/state';


interface InventoryActivityLogFilterPanelProps {
  filters: Partial<InventoryActivityLogQueryParams>;
  onChange: (filters: Partial<InventoryActivityLogQueryParams>) => void;
  onApply: () => void;
  onReset: () => void;
}

const InventoryActivityLogFilterPanel: FC<InventoryActivityLogFilterPanelProps> = ({ filters, onChange, onApply, onReset }) => {
  const handleChange = (field: keyof InventoryActivityLogQueryParams) => (value: any) => {
    onChange({ ...filters, [field]: value });
  };
  
  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {/* Left column */}
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
