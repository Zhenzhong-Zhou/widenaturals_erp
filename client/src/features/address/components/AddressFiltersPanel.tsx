import { type Dispatch, type FC, type SetStateAction, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomButton from '@components/common/CustomButton';
import { Controller, useForm } from 'react-hook-form';
import CustomerDropdown from '@features/lookup/components/CustomerDropdown';
import type { AddressFilterConditions } from '@features/address/state';
import type {
  CustomerLookupQuery,
  CustomerOption,
  LookupPaginationMeta,
} from '@features/lookup/state';
import { adjustBeforeDateInclusive } from '@utils/dateTimeUtils';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';

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
  const textFields: {
    name: keyof AddressFilterConditions;
    label: string;
    placeholder?: string;
  }[] = [
    { name: 'updatedBy', label: 'Updated By' },
    {
      name: 'keyword',
      label: 'Search Keyword',
      placeholder: 'Label, Name, Email, etc.',
    },
    { name: 'region', label: 'Region' },
    { name: 'country', label: 'Country' },
  ];

  const dateFields: { name: keyof AddressFilterConditions; label: string }[] = [
    { name: 'createdAfter', label: 'Created After' },
    { name: 'createdBefore', label: 'Created Before' },
    { name: 'updatedAfter', label: 'Updated After' },
    { name: 'updatedBefore', label: 'Updated Before' },
  ];

  const { control, handleSubmit, reset } = useForm<AddressFilterConditions>({
    defaultValues: filters,
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const submitFilters = (data: AddressFilterConditions) => {
    const adjusted: AddressFilterConditions = {
      ...data,
      createdBefore: adjustBeforeDateInclusive(data.createdBefore),
      updatedBefore: adjustBeforeDateInclusive(data.updatedBefore),
    };
    onChange(adjusted);
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

export default AddressFiltersPanel;
