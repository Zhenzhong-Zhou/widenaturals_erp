import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import { formatShipmentStatus } from '@utils/formatters';
import type { FlattenedShipmentHeader } from '@features/outboundFulfillment/state';
import { formatDate, formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';
import { formatTrackingSummary } from '@features/outboundFulfillment/utils';

interface OutboundShipmentHeaderSectionProps {
  orderNumber: string;
  flattened: FlattenedShipmentHeader;
}

const OutboundShipmentHeaderSection = ({
                                         orderNumber,
                                         flattened,
                                       }: OutboundShipmentHeaderSectionProps) => {
  // todo: add yes/no chip or another UI for boolean fields
  // todo: adjust all status to be chip or other UI with differ color
  return (
    <Section title="Shipment Header">
      <DetailsGrid>
        {/* Left column */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Order Number', value: orderNumber },
              {
                label: 'Shipment Status',
                value: flattened.statusName,
                format: () =>
                  formatShipmentStatus(
                    flattened.statusCode ?? '',
                    formatLabel(flattened.statusName) ?? ''
                  ),
              },
              {
                label: 'Shipped At',
                value: formatDate(
                  flattened.shippedAt,
                  'America/Vancouver',
                  '—'
                ),
              },
              {
                label: 'Delivery Method',
                value: flattened.deliveryMethodName || '—',
              },
              {
                label: 'Is Pickup',
                value: flattened.deliveryMethodIsPickup ? 'Yes' : 'No',
              },
              {
                label: 'Requires Tracking',
                value: flattened.deliveryMethodRequiresTracking ? 'Yes' : 'No',
              },
              {
                label: 'Estimated Time',
                value: flattened.deliveryMethodEstimatedTime || '—',
              },
              {
                label: 'Created At',
                value: flattened.createdAt || '—',
                format: () => formatDateTime(flattened.createdAt),
              },
              {
                label: 'Created By',
                value: flattened.createdByName || '—',
              },
            ]}
          />
        </DetailsGridItem>
        
        {/* Right column */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Warehouse', value: flattened.warehouseName || '—' },
              { label: 'Notes', value: flattened.notes || '—' },
              { label: 'Details', value: flattened.details || '—' },
              {
                label: 'Expected Delivery',
                value: flattened.expectedDeliveryDate || '—',
              },
              {
                label: 'Tracking Numbers',
                value: formatTrackingSummary(flattened.trackingNumbers),
              },
              {
                label: 'Updated At',
                value: formatDateTime(flattened.updatedAt || '—'),
              },
              { label: 'Updated By', value: flattened.updatedByName || '—' },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default OutboundShipmentHeaderSection;
