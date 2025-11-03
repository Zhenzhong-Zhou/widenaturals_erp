import { type FC, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomButton from '@components/common/CustomButton';
import { useForm } from 'react-hook-form';
import type { OrderListFilters } from '@features/order/state';
import { adjustBeforeDateInclusive } from '@utils/dateTimeUtils';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';

interface Props {
  filters: OrderListFilters;
  onChange: (filters: OrderListFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: OrderListFilters = {
  keyword: '',
  orderNumber: '',
  orderCategory: '',
  createdAfter: '',
  createdBefore: '',
  statusDateAfter: '',
  statusDateBefore: '',
};

const OrderFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset } = useForm<OrderListFilters>({
    defaultValues: filters,
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const submitFilters = (data: OrderListFilters) => {
    const adjusted: OrderListFilters = {
      ...data,
      createdBefore: adjustBeforeDateInclusive(data.createdBefore),
      statusDateBefore: adjustBeforeDateInclusive(data.statusDateBefore),
    };
    onChange(adjusted);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  const textFields: {
    name: keyof OrderListFilters;
    label: string;
    placeholder?: string;
  }[] = [
    { name: 'orderNumber', label: 'Order Number' },
    { name: 'keyword', label: 'Search Keyword', placeholder: 'Order #...' },
    { name: 'orderCategory', label: 'Order Category' },
  ];

  const dateFields: { name: keyof OrderListFilters; label: string }[] = [
    { name: 'createdAfter', label: 'Created After' },
    { name: 'createdBefore', label: 'Created Before' },
    { name: 'statusDateAfter', label: 'Status Date After' },
    { name: 'statusDateBefore', label: 'Status Date Before' },
  ];

  return (
    <Box mb={2} p={2} border="1px solid #ccc" borderRadius={2}>
      <form onSubmit={handleSubmit(submitFilters)}>
        <Grid container spacing={2} sx={{ minHeight: 160 }}>
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

export default OrderFiltersPanel;
