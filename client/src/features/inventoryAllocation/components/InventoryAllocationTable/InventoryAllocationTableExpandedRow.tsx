import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import type { InventoryAllocationSummary } from '@features/inventoryAllocation/state';

interface Props {
  row: InventoryAllocationSummary;
}

const InventoryAllocationTableExpandedRow: FC<Props> = ({ row }) => {
  const {
    orderCategory,
    allocationStatus,
    allocatedAt,
    allocatedCreatedAt,
    orderCreatedAt,
    orderUpdatedAt,
    orderUpdatedBy,
  } = row;
  
  const nameLabel = Array.isArray(allocationStatus?.names)
    ? allocationStatus.names.join(', ')
    : allocationStatus?.names ?? '—';
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Order Allocation Metadata
      </CustomTypography>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <DetailsSection
            fields={[
              { label: 'Order Category', value: orderCategory ?? '—', format: formatLabel },
              { label: 'Allocation Statuses', value: nameLabel, format: formatLabel },
              { label: 'Allocated At', value: allocatedAt, format: formatDate },
              { label: 'Allocation Created At', value: allocatedCreatedAt, format: formatDate },
              { label: 'Order Created At', value: orderCreatedAt, format: formatDate },
              { label: 'Order Updated At', value: orderUpdatedAt, format: formatDate },
              { label: 'Order Updated By', value: orderUpdatedBy, format: formatLabel },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryAllocationTableExpandedRow;
