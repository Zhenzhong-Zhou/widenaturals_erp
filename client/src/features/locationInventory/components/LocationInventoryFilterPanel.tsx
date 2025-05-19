import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomDatePicker from '@components/common/CustomDatePicker';
import { formatISO } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import type { LocationInventoryQueryParams } from '@features/locationInventory/state';
import BaseInput from '@components/common/BaseInput';
import CustomButton from '@components/common/CustomButton';

type FilterField = keyof Pick<
  LocationInventoryQueryParams,
  'productName' | 'materialName' | 'sku' | 'lotNumber' | 'inboundDate' | 'expiryDate' | 'status' | 'locationId'
>;

interface Props {
  initialFilters?: LocationInventoryQueryParams;
  onApply: (filters: LocationInventoryQueryParams) => void;
  onReset?: () => void;
  visibleFields?: FilterField[];
}

const LocationInventoryFilterPanel: FC<Props> = ({
                                                   initialFilters = {},
                                                   onApply,
                                                   onReset,
                                                   visibleFields,
                                                 }) => {
  const { handleSubmit, control, reset } = useForm<LocationInventoryQueryParams>({
    defaultValues: initialFilters,
  });
  
  const isVisible = (field: FilterField) =>
    !visibleFields || visibleFields.includes(field);
  
  const handleApply = (values: LocationInventoryQueryParams) => {
    onApply(values);
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit(handleApply)} sx={{ mb: 2 }}>
      <Grid container spacing={2}>
        {isVisible('productName') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="productName"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="Product Name" fullWidth size="small" />
              )}
            />
          </Grid>
        )}
        
        {isVisible('materialName') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="materialName"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="Material Name" fullWidth size="small" />
              )}
            />
          </Grid>
        )}
        
        {isVisible('sku') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="SKU" fullWidth size="small" />
              )}
            />
          </Grid>
        )}
        
        {isVisible('lotNumber') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="lotNumber"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="Lot Number" fullWidth size="small" />
              )}
            />
          </Grid>
        )}
        
        {isVisible('inboundDate') && (
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
                  sx={{size: 'small', fullWidth: true}}
                />
              )}
            />
          </Grid>
        )}
        
        {isVisible('expiryDate') && (
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
                  sx={{size: 'small', fullWidth: true}}
                />
              )}
            />
          </Grid>
        )}
        
        {isVisible('status') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="Status" fullWidth size="small" />
              )}
            />
          </Grid>
        )}
        
        {isVisible('locationId') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="locationId"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="Location ID" fullWidth size="small" />
              )}
            />
          </Grid>
        )}
        
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomButton type="submit" variant="contained" sx={{ mr: 1 }}>
            Apply Filters
          </CustomButton>
          <CustomButton
            variant="outlined"
            onClick={() => {
              reset();
              onReset?.();
            }}
          >
            Reset
          </CustomButton>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LocationInventoryFilterPanel;
