import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import type { OrderListItem } from '@features/order/state/orderTypes';
import { formatDateTime } from '@utils/dateTimeUtils';

interface OrderExpandedContentProps {
  row: OrderListItem;
}

const OrderExpandedContent: FC<OrderExpandedContentProps> = ({ row }) => {
  const fields = [
    { label: 'Status Date', value: formatDateTime(row.statusDate) },
    { label: 'Created At', value: formatDateTime(row.createdAt) },
    { label: 'Updated At', value: formatDateTime(row.updatedAt) },
    { label: 'Updated By', value: row.updatedBy },
    { label: 'Note', value: row.note },
  ];

  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={600} gutterBottom>
        Order Details
      </CustomTypography>

      <Grid container spacing={2}>
        {fields.map(({ label, value }, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6 }}>
            <Box>
              <CustomTypography
                variant="body2"
                fontWeight={600}
                sx={{ color: 'text.primary' }}
              >
                {label}:
              </CustomTypography>
              <CustomTypography
                variant="body2"
                sx={{ color: 'text.secondary', wordBreak: 'break-word' }}
              >
                {value || '—'}
              </CustomTypography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default OrderExpandedContent;
