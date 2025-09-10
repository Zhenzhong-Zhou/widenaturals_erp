import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import { formatOrderStatus } from '@utils/formatters';

export interface FlattenedAllocationOrderHeader {
  orderNumber: string;
  note: string | null;
  createdBy: string;
  orderStatus: string;
  orderStatusCode: string;
  orderStatusId: string;
  salespersonId: string;
  salespersonName: string;
}

interface AllocationOrderHeaderSectionProps {
  flattened: FlattenedAllocationOrderHeader;
}

const AllocationOrderHeaderSection: FC<AllocationOrderHeaderSectionProps> = ({ flattened }) => {
  return (
    <Section title="Order Header">
      <DetailsGrid>
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Order Number', value: flattened.orderNumber },
              {
                label: 'Order Status',
                value: flattened.orderStatus,
                format: () => formatOrderStatus(flattened.orderStatusCode, flattened.orderStatus),
              },
            ]}
          />
        </DetailsGridItem>
        
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Salesperson', value: flattened.salespersonName },
              { label: 'Note', value: flattened.note || '—' },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default AllocationOrderHeaderSection;
