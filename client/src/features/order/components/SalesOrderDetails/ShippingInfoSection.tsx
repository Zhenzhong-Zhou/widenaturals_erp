import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { formatLabel, formatPhoneNumber } from '@utils/textUtils';

interface ShippingInfoSectionProps {
  flattened: FlattenedOrderHeader;
}

const ShippingInfoSection: FC<ShippingInfoSectionProps> = ({ flattened }) => (
  <Section title="Shipping Info">
    <DetailsGrid>
      <DetailsGridItem fullWidth>
        <MemoizedDetailsSection
          fields={[
            {
              label: 'Receipt Name',
              value: flattened.shippingInfo.shippingFullname,
              format: formatLabel,
            },
            {
              label: 'Phone Number',
              value: flattened.shippingInfo.shippingPhone,
              format: formatPhoneNumber,
            },
            {
              label: 'Email',
              value: flattened.shippingInfo.shippingEmail,
            },
            {
              label: 'Shipping Address',
              value: flattened.shippingInfo.address,
            },
          ]}
        />
      </DetailsGridItem>
    </DetailsGrid>
  </Section>
);

export default ShippingInfoSection;
