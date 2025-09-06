import type { FC } from 'react';
import ConditionalSection from '@components/layout/ConditionalSection';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { formatLabel } from '@utils/textUtils';

interface DiscountInfoSectionProps {
  flattened: FlattenedOrderHeader;
}

const DiscountInfoSection: FC<DiscountInfoSectionProps> = ({ flattened }) => {
  return (
    <ConditionalSection title="Discount Info" condition={!!flattened.discount}>
      <DetailsGrid>
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Discount', value: flattened.discount, format: formatLabel },
              { label: 'Discount Label', value: flattened.discountLabel },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </ConditionalSection>
  );
};

export default DiscountInfoSection;
