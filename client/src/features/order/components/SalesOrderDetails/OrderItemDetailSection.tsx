import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDate } from '@utils/dateTimeUtils';
import type { OrderItem } from '@features/order/state';
import { formatLabel } from '@utils/textUtils';

interface Props {
  row: OrderItem;
}

const OrderItemDetailSection: FC<Props> = ({ row }) => {
  const metadata = row?.metadata as {
    reason?: string;
    db_price?: number;
    submitted_price?: number;
  } | null;
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Item Metadata
      </CustomTypography>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              { label: 'Created At', value: row.audit?.createdAt, format: formatDate },
              { label: 'Created By', value: row.audit?.createdBy?.name, format: formatLabel },
            ]}
          />
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <DetailsSection
            fields={[
              { label: 'Updated At', value: row.audit?.updatedAt, format: formatDate },
              { label: 'Updated By', value: row.audit?.updatedBy?.name, format: formatLabel },
            ]}
          />
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <DetailsSection
            fields={[
              { label: 'Reason', value: metadata?.reason ?? '—' },
              { label: 'DB Price', value: metadata?.db_price != null ? `$${metadata.db_price}` : '—' },
              { label: 'Submitted Price', value: metadata?.submitted_price != null ? `$${metadata.submitted_price}` : '—' },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderItemDetailSection;
