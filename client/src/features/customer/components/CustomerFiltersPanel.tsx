import { type FC, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import BaseInput from '@components/common/BaseInput';
import CustomDatePicker from '@components/common/CustomDatePicker';
import CustomButton from '@components/common/CustomButton';
import { Controller, useForm } from 'react-hook-form';
import type { CustomerFilters } from '@features/customer/state';

interface Props {
  filters: CustomerFilters;
  onChange: (filters: CustomerFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const CustomerFiltersPanel: FC<Props> = ({ filters, onChange, onApply, onReset }) => {
  const { control, handleSubmit, reset } = useForm<CustomerFilters>({
    defaultValues: filters
  });
  
  // Sync form reset when `filters` prop changes
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  const submitFilters = (data: CustomerFilters) => {
    onChange(data); // this will now be passed as query params directly
    onApply();
  };
  
  const resetFilters = () => {
    reset(filters);
    onReset();
  };
  
  return (
    <Box mb={2} p={2} border="1px solid #ccc" borderRadius={2}>
      <form onSubmit={handleSubmit(submitFilters)}>
        <Grid container spacing={2}>
          {/* Filter fields */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="keyword"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} label="Search Keyword" placeholder="Name, Email, etc." />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="region"
              control={control}
              render={({ field }) => <BaseInput {...field} value={field.value ?? ''} label="Region" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="country"
              control={control}
              render={({ field }) => <BaseInput {...field} value={field.value ?? ''} label="Country" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="createdBy"
              control={control}
              render={({ field }) => <BaseInput {...field} value={field.value ?? ''} label="Created By" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="createdAfter"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Created After" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="createdBefore"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Created Before" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="statusDateAfter"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Status Date After" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Controller
              name="statusDateBefore"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Status Date Before" />
              )}
            />
          </Grid>
        </Grid>
        
        {/* Filter Actions */}
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

export default CustomerFiltersPanel;
