import { type BaseSyntheticEvent, useId } from 'react';
import { Controller, type FieldValues, type UseFormReset } from 'react-hook-form';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import {
  BaseInput,
  CustomButton,
  CustomDatePicker,
  CustomTypography
} from '@components/index';
import { toISODate } from '@utils/dateTimeUtils';
import { BatchEntityType } from '@shared-types/batch';

interface BaseInventoryFilters {
  batchType?: BatchEntityType;
  [key: string]: any;
}

export interface InventoryFilterFieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'select' | 'date';
  options?: { label: string; value: string }[];
}

interface Props<T extends FieldValues> {
  control: any;
  handleSubmit: (
    callback: (values: T) => void
  ) => (e?: BaseSyntheticEvent) => void;
  onApply: (filters: T) => void;
  onReset?: () => void;
  reset: UseFormReset<T>;
  watch: (field: keyof T) => any;
  initialFilters: T;
  fields: InventoryFilterFieldConfig[];
  visibleFields?: (keyof T)[];
  showActionsWhenAll?: boolean;
  requireBatchTypeForActions?: boolean;
}

/**
 * BaseInventoryFilterPanel
 *
 * Shared filter panel for inventory-related pages.
 *
 * Design notes:
 * - Stores Date objects in form state (never formatted strings)
 * - Date normalization is expected to happen at submit time
 * - Avoids timezone drift by never calling `new Date(YYYY-MM-DD)`
 * - Keeps UI logic separate from API formatting concerns
 */
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
    
    if (
      (name.startsWith('product') || name === 'sku') &&
      batchType !== 'product'
    ) {
      return false;
    }
    
    return !((name.startsWith('material') || name.startsWith('part')) &&
      batchType !== 'packaging_material');
  };
  
  const handleApply = (values: T) => {
    const normalized = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value instanceof Date ? toISODate(value) : value,
      ])
    ) as T;
    onApply(normalized);
  };
  
  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        borderRadius: 2,
        backgroundColor: (theme) => theme.palette.background.default,
        mb: 2,
      }}
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
                          value={field.value ?? null}
                          onChange={field.onChange}
                          sx={{ size: 'small', fullWidth: true }}
                        />
                      );
                    }
                    
                    if (type === 'select') {
                      const fieldId = useId();
                      return (
                        <BaseInput
                          {...field}
                          label={label}
                          fullWidth
                          size="small"
                          select
                          value={field.value ?? ''}
                          slotProps={{
                            input: { id: fieldId },
                            inputLabel: { htmlFor: fieldId },
                          }}
                        >
                          {options?.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </BaseInput>
                      );
                    }
                    
                    return (
                      <BaseInput
                        {...field}
                        label={label}
                        fullWidth
                        size="small"
                        value={field.value ?? ''}
                      />
                    );
                  }}
                />
              </Grid>
            ) : null
          )}
          
          {showActionsWhenAll &&
            (!requireBatchTypeForActions ||
              (batchType !== undefined)) && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={2}>
                  <CustomButton type="submit" variant="contained">
                    Apply Filters
                  </CustomButton>
                  <CustomButton
                    variant="outlined"
                    onClick={() => {
                      const uiResetValues = Object.fromEntries(
                        Object.entries(initialFilters).map(([k, v]) => [
                          k,
                          v instanceof Date ? null : v,
                        ])
                      ) as T;
                      
                      reset(uiResetValues, {
                        keepDefaultValues: true,
                      });
                      
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
