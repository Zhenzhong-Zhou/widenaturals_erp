import { useId, type FC } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import BaseInput from '@components/common/BaseInput';
import CustomDatePicker from '@components/common/CustomDatePicker';
import CustomButton from '@components/common/CustomButton';
import { useForm, Controller } from 'react-hook-form';
import { formatISO } from 'date-fns';
import type { LocationInventoryFilters } from '@features/locationInventory/state';

type FilterField = keyof LocationInventoryFilters;

interface Props {
  initialFilters?: LocationInventoryFilters;
  onApply: (filters: LocationInventoryFilters) => void;
  onReset?: () => void;
  visibleFields?: FilterField[];
  showActionsWhenAll?: boolean;
}

const LocationInventoryFilterPanel: FC<Props> = ({
                                                   initialFilters = {},
                                                   onApply,
                                                   onReset,
                                                   visibleFields,
                                                   showActionsWhenAll,
                                                 }) => {
  const batchTypeId = useId();
  const { control, handleSubmit, watch, reset } = useForm<LocationInventoryFilters>({
    defaultValues: {
      ...initialFilters,
      batchType: undefined,
    },
  });
  
  const batchType = watch('batchType');
  
  const showField = (field: FilterField) => {
    if (visibleFields && !visibleFields.includes(field)) return false;
    if ((field.startsWith('product') || field === 'sku') && batchType !== 'product') return false;
    return !((field.startsWith('material') || field.startsWith('part')) &&
      batchType !== 'packaging_material');
  };
  
  const handleApply = (values: LocationInventoryFilters) => {
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
          {showField('batchType') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="batchType"
                control={control}
                render={({ field }) => (
                  <BaseInput
                    key={batchTypeId}
                    {...field}
                    value={field.value ?? ''}
                    select
                    label="Batch Type"
                    fullWidth
                    size="small"
                    slotProps={{
                      input: { id: batchTypeId },
                      inputLabel: { htmlFor: batchTypeId },
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="product">Product</MenuItem>
                    <MenuItem value="packaging_material">Packaging Material</MenuItem>
                  </BaseInput>
                )}
              />
            </Grid>
          )}
          
          {showField('locationName') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="locationName"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Location Name" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('productName') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="productName"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Product Name" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('sku') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="SKU" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('materialName') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="materialName"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Material Name" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('materialCode') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="materialCode"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Material Code" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('partName') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="partName"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Part Name" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('partCode') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="partCode"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Part Code" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('partType') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="partType"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Part Type" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('lotNumber') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="lotNumber"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Lot Number" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('status') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <BaseInput {...field} label="Status" fullWidth size="small" value={field.value ?? ''} />
                )}
              />
            </Grid>
          )}
          
          {showField('inboundDate') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="inboundDate"
                control={control}
                render={({ field }) => (
                  <CustomDatePicker
                    label="Inbound Date"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? formatISO(date, { representation: 'date' }) : '')
                    }
                    sx={{ size: 'small', fullWidth: true }}
                  />
                )}
              />
            </Grid>
          )}
          
          {showField('expiryDate') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="expiryDate"
                control={control}
                render={({ field }) => (
                  <CustomDatePicker
                    label="Expiry Date"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? formatISO(date, { representation: 'date' }) : '')
                    }
                    sx={{ size: 'small', fullWidth: true }}
                  />
                )}
              />
            </Grid>
          )}
          
          {showField('createdAt') && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Controller
                name="createdAt"
                control={control}
                render={({ field }) => (
                  <CustomDatePicker
                    label="Created At"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? formatISO(date, { representation: 'date' }) : '')
                    }
                    sx={{ size: 'small', fullWidth: true }}
                  />
                )}
              />
            </Grid>
          )}
          
          {showActionsWhenAll && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" spacing={2}>
                <CustomButton type="submit" variant="contained" sx={{ mr: 1 }}>
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

export default LocationInventoryFilterPanel;
