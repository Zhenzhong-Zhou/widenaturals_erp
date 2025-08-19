import type { FC } from 'react';
import ConditionalSection from '@components/layout/ConditionalSection';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { OverrideSummaryFormatter } from '@features/order/components/SalesOrderDetails/OverrideSummaryFormatter';

interface PriceOverrideSectionProps {
  flattened: FlattenedOrderHeader;
}

const PriceOverrideSection: FC<PriceOverrideSectionProps> = ({ flattened }) => (
  <ConditionalSection
    title="Override Info"
    condition={!!flattened.orderMetadata?.price_override_summary}
  >
    <DetailsGrid>
      <DetailsGridItem fullWidth>
        <MemoizedDetailsSection
          fields={[
            {
              label: 'Price Override Summary',
              value: flattened.orderMetadata?.price_override_summary ?? null,
              format: OverrideSummaryFormatter,
            },
          ]}
        />
      </DetailsGridItem>
    </DetailsGrid>
  </ConditionalSection>
);

export default PriceOverrideSection;
