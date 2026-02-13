import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import {
  CustomTypography,
  DetailsSection
} from '@components/index';
import type {
  FlattenedInventoryAllocationSummary
} from '@features/inventoryAllocation/state';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';

interface Props {
  row: FlattenedInventoryAllocationSummary;
}

/**
 * Expanded row renderer for inventory allocation summary tables.
 *
 * Displays allocation- and order-level metadata derived from
 * a flattened allocation summary record.
 */
const InventoryAllocationTableExpandedRow: FC<Props> = ({ row }) => {
  const {
    orderCategory,
    allocationStatusNames,
    allocatedAt,
    allocatedCreatedAt,
    orderCreatedAt,
    orderUpdatedAt,
    orderUpdatedBy,
  } = row;
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Order Allocation Metadata
      </CustomTypography>
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <DetailsSection
            fields={[
              {
                label: 'Order Category',
                value: orderCategory ?? '—',
                format: formatLabel,
              },
              {
                label: 'Allocation Statuses',
                value: allocationStatusNames || '—',
                format: formatLabel,
              },
              {
                label: 'Allocated At',
                value: allocatedAt,
                format: formatDate,
              },
              {
                label: 'Allocation Created At',
                value: allocatedCreatedAt,
                format: formatDate,
              },
              {
                label: 'Order Created At',
                value: orderCreatedAt,
                format: formatDate,
              },
              {
                label: 'Order Updated At',
                value: orderUpdatedAt,
                format: formatDate,
              },
              {
                label: 'Order Updated By',
                value: orderUpdatedBy,
                format: formatLabel,
              },
            ]}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryAllocationTableExpandedRow;
