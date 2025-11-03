import { type FC, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomButton from '@components/common/CustomButton';
import { useForm } from 'react-hook-form';
import type { OutboundFulfillmentFilters } from '@features/outboundFulfillment/state';
import { adjustBeforeDateInclusive } from '@utils/dateTimeUtils';
import { renderDateField, renderInputField } from '@utils/filters/filterUtils';

interface Props {
  filters: OutboundFulfillmentFilters;
  onChange: (filters: OutboundFulfillmentFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const emptyFilters: OutboundFulfillmentFilters = {
  keyword: '',
  orderNumber: '',
  orderId: '',
  createdBy: '',
  updatedBy: '',
  createdAfter: '',
  createdBefore: '',
  shippedAfter: '',
  shippedBefore: '',
  statusIds: [],
  warehouseIds: [],
  deliveryMethodIds: [],
};

/**
 * Filter panel for outbound fulfillments.
 * Supports shipment-level, order-level, and keyword filters.
 */
const OutboundFulfillmentFiltersPanel: FC<Props> = ({
  filters,
  onChange,
  onApply,
  onReset,
}) => {
  const { control, handleSubmit, reset } = useForm<OutboundFulfillmentFilters>({
    defaultValues: filters,
  });

  useEffect(() => {
    reset(filters);
  }, [filters, reset]);

  const submitFilters = (data: OutboundFulfillmentFilters) => {
    const adjusted: OutboundFulfillmentFilters = {
      ...data,
      createdBefore: adjustBeforeDateInclusive(data.createdBefore),
      shippedBefore: adjustBeforeDateInclusive(data.shippedBefore),
    };
    onChange(adjusted);
    onApply();
  };

  const resetFilters = () => {
    reset(emptyFilters);
    onReset();
  };

  const textFields: {
    name: keyof OutboundFulfillmentFilters;
    label: string;
    placeholder?: string;
  }[] = [
    { name: 'orderNumber', label: 'Order Number' },
    // { name: 'orderId', label: 'Order ID' },
    {
      name: 'keyword',
      label: 'Search Keyword',
      placeholder: 'Order #, Warehouse, Method...',
    },
    // { name: 'createdBy', label: 'Created By (User ID)' },
    // { name: 'updatedBy', label: 'Updated By (User ID)' },
  ];

  const dateFields: {
    name: keyof OutboundFulfillmentFilters;
    label: string;
  }[] = [
    { name: 'createdAfter', label: 'Created After' },
    { name: 'createdBefore', label: 'Created Before' },
    { name: 'shippedAfter', label: 'Shipped After' },
    { name: 'shippedBefore', label: 'Shipped Before' },
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

export default OutboundFulfillmentFiltersPanel;
