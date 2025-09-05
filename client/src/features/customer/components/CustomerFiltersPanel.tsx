import { type FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomButton from '@components/common/CustomButton';
import type { CustomerFilters } from '@features/customer/state';
import {
  renderBooleanSelectField,
  renderDateField,
  renderInputField,
} from '@utils/filters/filterUtils';
import { adjustAfterDate, adjustBeforeDateInclusive } from '@utils/dateTimeUtils';

interface Props {
  filters: CustomerFilters;
  onChange: (filters: CustomerFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: CustomerFilters = {
  keyword: '',
  createdBy: '',
  createdAfter: '',
  createdBefore: '',
  statusDateAfter: '',
  statusDateBefore: '',
  onlyWithAddress: undefined,
};

const textFields: {
  name: keyof CustomerFilters;
  label: string;
  placeholder?: string;
}[] = [
  {
    name: 'keyword',
    label: 'Search Keyword',
    placeholder: 'Name, Email, etc.',
  },
  { name: 'createdBy', label: 'Created By' },
];

const dateFields: { name: keyof CustomerFilters; label: string }[] = [
  { name: 'createdAfter', label: 'Created After' },
  { name: 'createdBefore', label: 'Created Before' },
  { name: 'statusDateAfter', label: 'Status Date After' },
  { name: 'statusDateBefore', label: 'Status Date Before' },
];

const CustomerFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset } = useForm<CustomerFilters>({
    defaultValues: filters,
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);
  
  /**
   * Submits adjusted customer filters by transforming dates into ISO 8601 strings.
   *
   * - `createdAfter` and `statusDateAfter` are normalized to the start of the day.
   * - `createdBefore` and `statusDateBefore` are normalized to the end of the day (by adding 1 day).
   *
   * @param data - Raw form values from customer filter panel
   */
  const submitFilters = (data: CustomerFilters) => {
    const adjusted: CustomerFilters = {
      ...data,
      createdAfter: adjustAfterDate(data.createdAfter),
      createdBefore: adjustBeforeDateInclusive(data.createdBefore),
      statusDateAfter: adjustAfterDate(data.statusDateAfter),
      statusDateBefore: adjustBeforeDateInclusive(data.statusDateBefore),
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
          {textFields.map(({ name, label, placeholder }) =>
            renderInputField(control, name, label, placeholder)
          )}
          {renderBooleanSelectField(
            control,
            'onlyWithAddress',
            'Address Filter',
            [
              { value: '', label: 'All Customers' },
              { value: 'true', label: 'Only with Address' },
              { value: 'false', label: 'Only without Address' },
            ]
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

export default CustomerFiltersPanel;
