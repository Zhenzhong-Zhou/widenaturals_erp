import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { toUpperCase, formatToThreeDecimal } from '@utils/textUtils';

interface CurrencyInfoSectionProps {
  flattened: FlattenedOrderHeader;
}

const CurrencyInfoSection: FC<CurrencyInfoSectionProps> = ({ flattened }) => (
  <Section title="Currency Info">
    <DetailsGrid>
      <DetailsGridItem>
        <MemoizedDetailsSection
          fields={[
            {
              label: 'Currency Code',
              value: flattened.paymentInfo.currencyCode,
              format: toUpperCase,
            },
            {
              label: 'Exchange Rate',
              value: flattened.paymentInfo.exchangeRate,
              format: formatToThreeDecimal,
            },
          ]}
        />
      </DetailsGridItem>
    </DetailsGrid>
  </Section>
);

export default CurrencyInfoSection;
