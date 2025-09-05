import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatLabel } from '@utils/textUtils';
import type { InventoryAllocationSummary } from '@features/inventoryAllocation/state';

interface Props {
  row: InventoryAllocationSummary;
}

const InventoryAllocationTableExpandedRow: FC<Props> = ({ row }) => {
  const {
    orderCategory,
    allocationStatus,
    allocatedAt,
    allocatedCreatedAt
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
              { label: 'Allocated At', value: allocatedAt, format: formatLabel },
              { label: 'Allocation Created At', value: allocatedCreatedAt, format: formatLabel },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryAllocationTableExpandedRow;
