import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import { formatShipmentStatus } from '@utils/formatters';
import type { FlattenedShipmentHeader } from '@features/outboundFulfillment/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

interface OutboundShipmentHeaderSectionProps {
  orderNumber: string;
  flattened: FlattenedShipmentHeader;
}

const OutboundShipmentHeaderSection: FC<OutboundShipmentHeaderSectionProps> = ({ orderNumber, flattened }) => {
  return (
    <Section title="Shipment Header">
      <DetailsGrid>
        {/* Left column */}
        <DetailsGridItem>
          // todo: add yes no chip or another ui
          // todo: adjust all status to be chip or other ui with differ color
          <MemoizedDetailsSection
            fields={[
              { label: 'Order Number', value: orderNumber },
              {
                label: 'Shipment Status',
                value: flattened.statusName,
                format: () =>
                  formatShipmentStatus(flattened.statusCode ?? '', formatLabel(flattened.statusName) ?? ''),
              },
              { label: 'Shipped At', value: flattened.shippedAt || '—' },
              { label: 'Delivery Methode', value: flattened.deliveryMethodName || '—' },
              { label: 'Is Pickup', value: flattened.deliveryMethodIsPickup ? 'Yes' : 'No' },
              { label: 'Estimated Time', value: flattened.deliveryMethodEstimatedTime || '—' },
              {
                label: 'Created At',
                value: flattened.createdAt || '—',
                format: () => formatDateTime(flattened.createdAt)
              },
              { label: 'Created By', value: flattened.createdByName || '—' },
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
              { label: 'Expected Delivery', value: flattened.expectedDeliveryDate || '—' },
              {
                label: 'Tracking Number',
                value: flattened.trackingNumber || '—',
              },
              {
                label: 'Carrier / Service',
                value: flattened.trackingCarrier
                  ? `${flattened.trackingCarrier} (${flattened.trackingService || '—'})`
                  : '—',
              },
              { label: 'Updated At', value: flattened.updatedAt || '—' },
              { label: 'Updated By', value: flattened.updatedByName || '—' },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default OutboundShipmentHeaderSection;
