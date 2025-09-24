import { type FC } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CustomTypography from '@components/common/CustomTypography';
import type { OutboundShipmentRecord } from '@features/outboundFulfillment/state';
import { formatDateTime } from '@utils/dateTimeUtils';

interface OutboundFulfillmentExpandedContentProps {
  row: OutboundShipmentRecord;
}

/**
 * Expanded content for a single outbound fulfillment row.
 * Displays audit fields, shipment dates, and notes.
 */
const OutboundFulfillmentExpandedContent: FC<
  OutboundFulfillmentExpandedContentProps
> = ({ row }) => {
  const fields = [
    { label: 'Created At', value: formatDateTime(row.audit?.createdAt) },
    {
      label: 'Created By',
      value: row.audit?.createdBy?.fullName ?? '—',
    },
    { label: 'Updated At', value: formatDateTime(row.audit?.updatedAt) },
    {
      label: 'Updated By',
      value: row.audit?.updatedBy?.fullName ?? '—',
    },
    { label: 'Notes', value: row.notes },
  ];
  
  return (
    <Box sx={{ px: 3, py: 2 }}>
      <CustomTypography variant="subtitle1" fontWeight={600} gutterBottom>
        Outbound Fulfillment Details
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

export default OutboundFulfillmentExpandedContent;
