import { type Dispatch, type FC, type SetStateAction, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import BaseInput from '@components/common/BaseInput';
import CustomDatePicker from '@components/common/CustomDatePicker';
import CustomButton from '@components/common/CustomButton';
import { Controller, useForm } from 'react-hook-form';
import type { AddressFilterConditions } from '@features/address/state';
import type { CustomerLookupQuery, CustomerOption, LookupPaginationMeta } from '@features/lookup/state';
import CustomerDropdown from '@features/lookup/components/CustomerDropdown.tsx';
import { adjustBeforeDateInclusive } from '@utils/dateTimeUtils.ts';

interface Props {
  filters: AddressFilterConditions;
  onChange: (filters: AddressFilterConditions) => void;
  onApply: () => void;
  onReset: () => void;
  customerDropdownOptions: CustomerOption[];
  fetchCustomerDropdownOptions: (params: CustomerLookupQuery) => void;
  customerLookupLoading?: boolean;
  customerLookupError?: string | null;
  customerLookupMeta: LookupPaginationMeta;
  fetchParams: CustomerLookupQuery;
  setFetchParams: Dispatch<SetStateAction<CustomerLookupQuery>>;
}

const AddressFiltersPanel: FC<Props> = ({
                                          filters,
                                          onChange,
                                          onApply,
                                          onReset,
                                          customerDropdownOptions,
                                          fetchCustomerDropdownOptions,
                                          customerLookupLoading,
                                          customerLookupError,
                                          customerLookupMeta,
                                          fetchParams,
                                          setFetchParams,
                                        }) => {
  const emptyFilters: AddressFilterConditions = {
    keyword: '',
    region: '',
    country: '',
    createdAfter: '',
    createdBefore: '',
    updatedAfter: '',
    updatedBefore: '',
    updatedBy: '',
  };
  
  const { control, handleSubmit, reset } = useForm<AddressFilterConditions>({
    defaultValues: filters,
  });
  
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  const submitFilters = (data: AddressFilterConditions) => {
    const adjustedFilters: AddressFilterConditions = {
      ...data,
      createdBefore: adjustBeforeDateInclusive(data.createdBefore),
      updatedBefore: adjustBeforeDateInclusive(data.updatedBefore),
    };
    
    onChange(adjustedFilters);
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <CustomerDropdown
                  {...field}
                  label="Customer"
                  value={field.value ?? ''}
                  onChange={(id) => field.onChange(id)}
                  inputValue={fetchParams.keyword ?? ''}
                  onInputChange={(_e, newVal) => {
                    setFetchParams((prev) => ({
                      ...prev,
                      keyword: newVal,
                      offset: 0,
                    }));
                  }}
                  options={customerDropdownOptions}
                  loading={customerLookupLoading}
                  error={customerLookupError}
                  paginationMeta={customerLookupMeta}
                  fetchParams={fetchParams}
                  setFetchParams={setFetchParams}
                  onRefresh={(params) => fetchCustomerDropdownOptions(params)}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="updatedBy"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} value={field.value ?? ''} label="Updated By" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="keyword"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} value={field.value ?? ''} label="Search Keyword" placeholder="Label, Name, Email, etc." sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} value={field.value ?? ''} label="Region" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <BaseInput {...field} value={field.value ?? ''} label="Country" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          
          {/* Date Fields */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="createdAfter"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Created After" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="createdBefore"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Created Before" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="updatedAfter"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Updated After" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="updatedBefore"
              control={control}
              render={({ field }) => (
                <CustomDatePicker {...field} value={field.value ?? ''} label="Updated Before" sx={{ minHeight: 56 }} />
              )}
            />
          </Grid>
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

export default AddressFiltersPanel;
