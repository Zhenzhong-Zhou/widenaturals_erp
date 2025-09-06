import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { formatDateTime } from '@utils/dateTimeUtils';
import { formatLabel } from '@utils/textUtils';

interface AuditInfoSectionProps {
  flattened: FlattenedOrderHeader;
}

const AuditInfoSection: FC<AuditInfoSectionProps> = ({ flattened }) => (
  <Section title="Audit Info">
    <DetailsGrid>
      <DetailsGridItem>
        <MemoizedDetailsSection
          fields={[
            {
              label: 'Created At',
              value: flattened.auditInfo.createdAt,
              format: formatDateTime,
            },
            {
              label: 'Created By',
              value: flattened.auditInfo.createdBy?.name ?? null,
              format: formatLabel,
            },
          ]}
        />
      </DetailsGridItem>
      <DetailsGridItem>
        <MemoizedDetailsSection
          fields={[
            {
              label: 'Updated At',
              value: flattened.auditInfo.updatedAt,
              format: (val) => formatDateTime(val, 'America/Vancouver', '-'),
            },
            {
              label: 'Updated By',
              value: flattened.auditInfo.updatedBy?.name ?? null,
              format: formatLabel,
            },
          ]}
        />
      </DetailsGridItem>
    </DetailsGrid>
  </Section>
);

export default AuditInfoSection;
