import type { BaseSyntheticEvent } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';
import { Controller } from 'react-hook-form';
import { formatISO } from 'date-fns';
import BaseInput from '@components/common/BaseInput';
import CustomDatePicker from '@components/common/CustomDatePicker';

interface BaseInventoryFilters {
  batchType?: string;
  [key: string]: any;
}

export interface InventoryFilterFieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
}

interface Props<T> {
  control: any;
  handleSubmit: (callback: (values: T) => void) => (e?: BaseSyntheticEvent) => void;
  onApply: (filters: T) => void;
  onReset?: () => void;
  reset: (values?: T) => void;
  watch: (field: keyof T) => any;
  initialFilters?: T;
  fields: InventoryFilterFieldConfig[];
  visibleFields?: (keyof T)[];
  showActionsWhenAll?: boolean;
  requireBatchTypeForActions?: boolean;
}

const BaseInventoryFilterPanel = <T extends BaseInventoryFilters>({
                                        control,
                                        handleSubmit,
                                        onApply,
                                        onReset,
                                        reset,
                                        watch,
                                        initialFilters,
                                        fields,
                                        visibleFields,
                                        showActionsWhenAll,
                                        requireBatchTypeForActions,
                                      }: Props<T>) => {
  const batchType = watch('batchType');
  
  const showField = (name: string) => {
    if (visibleFields && !visibleFields.includes(name as keyof T)) return false;
    if ((name.startsWith('product') || name === 'sku') && batchType !== 'product') return false;
    return !((name.startsWith('material') || name.startsWith('part')) && batchType !== 'packaging_material');
  };
  
  const handleApply = (values: T) => {
    onApply(values);
  };
  
  return (
    <Paper
      elevation={1}
      sx={{ p: 3, borderRadius: 2, backgroundColor: (theme) => theme.palette.background.default, mb: 2 }}
    >
      <CustomTypography variant="body1" sx={{ mb: 2 }}>
        Filters
      </CustomTypography>
      
      <Box component="form" onSubmit={handleSubmit(handleApply)} sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          {fields.map(({ name, label, type = 'text', options }) =>
            showField(name) ? (
              <Grid key={name} size={{ xs: 12, sm: 6, md: 3 }}>
                <Controller
                  name={name as any}
                  control={control}
                  render={({ field }) => {
                    if (type === 'date') {
                      return (
                        <CustomDatePicker
                          label={label}
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date) =>
                            field.onChange(date ? formatISO(date, { representation: 'date' }) : '')
                          }
                          sx={{ size: 'small', fullWidth: true }}
                        />
                      );
                    }
                    if (type === 'select') {
                      return (
                        <BaseInput {...field} label={label} fullWidth size="small" select value={field.value ?? ''}>
                          {options?.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </BaseInput>
                      );
                    }
                    return <BaseInput {...field} label={label} fullWidth size="small" value={field.value ?? ''} />;
                  }}
                />
              </Grid>
            ) : null
          )}
          
          {showActionsWhenAll && (!requireBatchTypeForActions || (batchType !== undefined && batchType !== '')) && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" spacing={2}>
                <CustomButton type="submit" variant="contained">
                  Apply Filters
                </CustomButton>
                <CustomButton
                  variant="outlined"
                  onClick={() => {
                    reset(initialFilters);
                    onReset?.();
                  }}
                >
                  Reset
                </CustomButton>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Box>
    </Paper>
  );
};

export default BaseInventoryFilterPanel;
