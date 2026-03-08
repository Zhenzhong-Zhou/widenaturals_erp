import type { FC } from 'react';
import {
  DetailsGrid,
  DetailsGridItem,
  DetailsSection,
  Section
} from '@components/index';
import type { FlattenedFulfillmentRow } from '@features/outboundFulfillment/state';
import { formatDateTime } from '@utils/dateTimeUtils';

interface OutboundFulfillmentExpandedSectionProps {
  row: FlattenedFulfillmentRow;
}

const OutboundFulfillmentExpandedSection: FC<
  OutboundFulfillmentExpandedSectionProps
> = ({ row }) => {
  const isPackagingMaterial = row.itemType === 'packaging_material';
  
  const itemInfoFields = isPackagingMaterial
    ? [
      {
        label: 'Material Code',
        value: row.packagingMaterialCode || '—',
      },
      {
        label: 'Material Label',
        value: row.packagingMaterialLabel || '—',
      },
      {
        label: 'Fulfillment Note',
        value: row.fulfillmentNote || '—',
      },
    ]
    : [
      { label: 'Category', value: row.category || '—' },
      { label: 'Region', value: row.region || '—' },
      { label: 'Size Label', value: row.sizeLabel || '—' },
      { label: 'SKU Code', value: row.skuCode || '—' },
      { label: 'Barcode', value: row.barcode || '—' },
      { label: 'Fulfillment Note', value: row.fulfillmentNote || '—' },
    ];
  
  return (
    <Section title="Fulfillment Item Info">
      <DetailsGrid>
        {/* Left column - Item Info */}
        <DetailsGridItem>
          <DetailsSection fields={itemInfoFields} />
        </DetailsGridItem>
        
        {/* Right column - Fulfillment & Audit Info */}
        <DetailsGridItem>
          <DetailsSection
            fields={[
              {
                label: 'Created At',
                value: row.createdAt || '—',
                format: () => formatDateTime(row.createdAt),
              },
              { label: 'Created By', value: row.createdByName || '—' },
              {
                label: 'Updated At',
                value: row.updatedAt || '—',
                format: () => formatDateTime(row.updatedAt),
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
