import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';

interface BillingInfoSectionProps {
  flattened: FlattenedOrderHeader;
}

const BillingInfoSection: FC<BillingInfoSectionProps> = ({ flattened }) => (
  <Section title="Billing Info">
    <DetailsGrid>
      <DetailsGridItem fullWidth>
        <MemoizedDetailsSection
          fields={[
            {
              label: 'Billing Name',
              value: flattened.billingInfo.billingFullname,
              format: formatLabel,
            },
            {
              label: 'Phone Number',
              value: flattened.billingInfo.billingPhone,
              format: formatPhoneNumber,
            },
            {
              label: 'Email',
              value: flattened.billingInfo.billingEmail,
            },
            {
              label: 'Billing Address',
              value: flattened.billingInfo.address,
            },
          ]}
        />
      </DetailsGridItem>
    </DetailsGrid>
  </Section>
);

export default BillingInfoSection;
