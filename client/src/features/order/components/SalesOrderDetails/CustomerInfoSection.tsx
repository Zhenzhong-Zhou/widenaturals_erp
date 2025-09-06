import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';

interface CustomerInfoSectionProps {
  flattened: FlattenedOrderHeader;
}

const CustomerInfoSection: FC<CustomerInfoSectionProps> = ({ flattened }) => {
  return (
    <Section title="Customer Info">
      <DetailsGrid>
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Customer Name', value: flattened.customerName, format: formatLabel },
              { label: 'Customer Email', value: flattened.customerEmail },
            ]}
          />
        </DetailsGridItem>
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Customer Phone', value: flattened.customerPhone, format: formatPhoneNumber },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default CustomerInfoSection;
