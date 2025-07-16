import type { FC } from 'react';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import FilterPanelLayout from '@components/common/FilterPanelLayout';
import BaseInput from '@components/common/BaseInput';
import BooleanSelect from '@components/common/BooleanSelect';
import CustomDatePicker from '@components/common/CustomDatePicker';
import { adjustBeforeDateInclusive, toISO } from '@utils/dateTimeUtils';
import type { OrderTypeFilters } from '@features/orderType/state';
import { normalizeDateValue } from '@utils/formUtils';

interface Props {
  filters: OrderTypeFilters;
  onChange: (filters: OrderTypeFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: OrderTypeFilters = {
  name: '',
  code: '',
  category: '',
  statusId: '',
  requiresPayment: undefined,
  createdBy: '',
  updatedBy: '',
  keyword: '',
  createdAfter: '',
  createdBefore: '',
  updatedAfter: '',
  updatedBefore: '',
};

const OrderTypeFiltersPanel: FC<Props> = ({ filters, onChange, onApply, onReset }) => {
  const textFields: { name: keyof OrderTypeFilters; label: string }[] = [
    { name: 'name', label: 'Name' },
    { name: 'code', label: 'Code' },
    { name: 'category', label: 'Category' },
    { name: 'statusId', label: 'Status ID' },
    { name: 'keyword', label: 'Search Keyword' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'updatedBy', label: 'Updated By' },
  ];
  
  const dateFields: { name: keyof OrderTypeFilters; label: string }[] = [
    { name: 'createdAfter', label: 'Created After' },
    { name: 'createdBefore', label: 'Created Before' },
    { name: 'updatedAfter', label: 'Updated After' },
    { name: 'updatedBefore', label: 'Updated Before' },
  ];
  
  const { control, handleSubmit, reset } = useForm<OrderTypeFilters>({
    defaultValues: filters,
  });
  
  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  const submitFilters = (data: OrderTypeFilters) => {
    const adjusted: OrderTypeFilters = {
      ...data,
      createdAfter: toISO(data.createdAfter),
      createdBefore: toISO(adjustBeforeDateInclusive(data.createdBefore)),
      updatedAfter: toISO(data.updatedAfter),
      updatedBefore: toISO(adjustBeforeDateInclusive(data.updatedBefore)),
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
        <FilterPanelLayout onReset={resetFilters}>
          {textFields.map(({ name, label }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={name}>
              <Controller
                name={name}
                control={control}
                render={({ field }) =>
                  <BaseInput
                    {...field}
                    value={field.value ?? ''}
                    label={label}
                    sx={{ minHeight: 56 }}
                  />
              }
              />
            </Grid>
          ))}
          
          {dateFields.map(({ name, label }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={name}>
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <CustomDatePicker
                    {...field}
                    value={normalizeDateValue(field.value)}
                    label={label}
                    sx={{ minHeight: 56 }}
                  />
                )}
              />
            </Grid>
          ))}
          
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Controller
              name="requiresPayment"
              control={control}
              render={({ field }) => (
                <BooleanSelect {...field} label="Requires Payment" />
              )}
            />
          </Grid>
        </FilterPanelLayout>
      </form>
    </Box>
  );
};

export default OrderTypeFiltersPanel;
