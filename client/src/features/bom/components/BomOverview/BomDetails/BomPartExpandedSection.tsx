import { type FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import { formatDateTime } from '@utils/dateTimeUtils';
import type { FlattenedBomDetailRow } from '@features/bom/state/bomTypes';

/**
 * Displays additional metadata for a specific BOM part row,
 * including description, specifications, notes, and audit info.
 */
interface BomPartExpandedSectionProps {
  row: FlattenedBomDetailRow;
}

const BomPartExpandedSection: FC<BomPartExpandedSectionProps> = ({ row }) => {
  return (
    <Section title="Additional Part Details">
      <DetailsGrid>
        {/* --- Left column: Descriptive details --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Description', value: row.partDescription || '—' },
              { label: 'Specifications', value: row.specifications || '—' },
              { label: 'Note', value: row.note || '—' },
            ]}
          />
        </DetailsGridItem>

        {/* --- Right column: Audit info --- */}
        <DetailsGridItem>
          <MemoizedDetailsSection
            sectionTitle="Audit Info"
            fields={[
              { label: 'Created By', value: row.createdBy || '—' },
              {
                label: 'Created At',
                value: formatDateTime(row.createdAt) || '—',
              },
              { label: 'Updated By', value: row.updatedBy || '—' },
              {
                label: 'Updated At',
                value: formatDateTime(row.updatedAt) || '—',
              },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default BomPartExpandedSection;
