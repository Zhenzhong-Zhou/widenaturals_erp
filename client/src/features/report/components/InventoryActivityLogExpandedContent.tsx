import type { FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import DetailsSection from '@components/common/DetailsSection';
import { formatDate } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import type { InventoryActivityLogEntry } from '@features/report/state';
import type { MergedInventoryActivityLogEntry } from '../utils/logUtils';

interface Props {
  row: InventoryActivityLogEntry | MergedInventoryActivityLogEntry;
}

const InventoryActivityLogExpandedContent: FC<Props> = ({ row }) => (
  <Box sx={{ px: 3, py: 2 }}>
    <CustomTypography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
      Log Details
    </CustomTypography>
    
    <Grid container spacing={2}>
      {/* Left column */}
      <Grid size={{ xs: 12, md: 6 }}>
        <DetailsSection
          fields={[
            { label: 'Order Number', value: row.order.number },
            { label: 'Order Type', value: row.order.type, format: formatLabel },
            { label: 'Order Status', value: row.order.status, format: formatLabel },
            { label: 'Adjustment Type', value: row.adjustmentType, format: formatLabel },
            {
              label: 'Location / Warehouse',
              value:
                'combinedNames' in row
                  ? row.combinedNames
                  : [row.locationName, row.warehouseName].filter(Boolean).join(', ')
            },
            { label: 'Source', value: row.source?.type, format: formatLabel },
            { label: 'Ref ID', value: row.source?.refId },
          ]}
        />
      </Grid>
      
      {/* Right column */}
      <Grid size={{ xs: 12, md: 6 }}>
        <DetailsSection
          fields={[
            {
              label: 'Expiry Date',
              value:
                row.batchType === 'product'
                  ? row.productInfo?.expiryDate
                  : row.packagingMaterialInfo?.expiryDate,
              format: formatDate,
            },
            { label: 'Metadata Source', value: row.metadata?.source, format: formatLabel },
            { label: 'Metadata Scope', value: row.metadata?.source_level, format: formatLabel },
            { label: 'Comments', value: row.comments },
          ]}
        />
      </Grid>
    </Grid>
  </Box>
);

export default InventoryActivityLogExpandedContent;
