import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedFulfillmentRow } from '@features/outboundFulfillment/state';
import { formatDateTime } from '@utils/dateTimeUtils';

interface OutboundFulfillmentExpandedSectionProps {
  row: FlattenedFulfillmentRow;
}

const OutboundFulfillmentExpandedSection: FC<OutboundFulfillmentExpandedSectionProps> = ({ row }) => {
  return (
    <Section title="Fulfillment Item Info">
      <DetailsGrid>
        {/* Left column - Product Info */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Category', value: row.category || '—' },
              { label: 'Region', value: row.region || '—' },
              { label: 'Size Label', value: row.sizeLabel || '—' },
              { label: 'Fulfillment Note', value: row.fulfillmentNote || '—' },
            ]}
          />
        </DetailsGridItem>
        
        {/* Right column - Fulfillment & Audit Info */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              {
                label: 'Created At',
                value: row.createdAt || '—' ,
                format: () => formatDateTime(row.createdAt)
             },
              { label: 'Created By', value: row.createdByName || '—' },
              {
                label: 'Updated At',
                value: row.updatedAt || '—' ,
                format: () => formatDateTime(row.updatedAt)
              },
              { label: 'Updated By', value: row.updatedByName || '—' },
              { label: 'Fulfilled By', value: row.fulfilledByName || '—' },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default OutboundFulfillmentExpandedSection;
