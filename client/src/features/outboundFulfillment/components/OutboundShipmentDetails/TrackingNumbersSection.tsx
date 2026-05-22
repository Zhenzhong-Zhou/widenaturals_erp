import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { CustomButton, Section } from '@components/index';
import type { FlattenedShipmentHeader } from '@features/outboundFulfillment/state';
import { formatDate } from '@utils/dateTimeUtils';

type Props = {
  flattened: FlattenedShipmentHeader;
};

const TrackingNumbersSection = ({ flattened }: Props) => {
  const { trackingNumbers, deliveryMethodRequiresTracking } = flattened;
  
  if (trackingNumbers.length === 0) {
    return (
      <Section title="Tracking Numbers">
        <Box sx={{ color: 'text.secondary', py: 2 }}>
          No tracking attached yet.
          {deliveryMethodRequiresTracking && (
            <CustomButton
              variant="outlined"
              size="small"
              sx={{ ml: 2 }}
              onClick={() => {
                /* open attach-tracking modal */
              }}
            >
              Add Tracking
            </CustomButton>
          )}
        </Box>
      </Section>
    );
  }
  
  return (
    <Section title={`Tracking Numbers (${trackingNumbers.length})`}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tracking #</TableCell>
            <TableCell>Carrier</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>BOL #</TableCell>
            <TableCell>Freight Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Shipped Date</TableCell>
            <TableCell>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trackingNumbers.map((t) => (
            <TableRow key={t.trackingId}>
              <TableCell>{t.trackingNumber ?? '—'}</TableCell>
              <TableCell>{t.carrier}</TableCell>
              <TableCell>{t.serviceName ?? '—'}</TableCell>
              <TableCell>{t.bolNumber ?? '—'}</TableCell>
              <TableCell>{t.freightType ?? '—'}</TableCell>
              <TableCell>{t.statusName ?? '—'}</TableCell>
              <TableCell>
                {t.shippedDate && formatDate(t.shippedDate ?? '-')}
              </TableCell>
              <TableCell>{t.notes ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
};

export default TrackingNumbersSection;
