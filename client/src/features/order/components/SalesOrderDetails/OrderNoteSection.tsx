import type { FC } from 'react';
import ConditionalSection from '@components/layout/ConditionalSection';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';

interface OrderNoteSectionProps {
  flattened: FlattenedOrderHeader;
}

const OrderNoteSection: FC<OrderNoteSectionProps> = ({ flattened }) => (
  <ConditionalSection title="Order Note" condition={!!flattened.orderNote}>
    <DetailsGrid>
      <DetailsGridItem fullWidth>
        <MemoizedDetailsSection
          fields={[{ label: 'Note', value: flattened.orderNote }]}
        />
      </DetailsGridItem>
    </DetailsGrid>
  </ConditionalSection>
);

export default OrderNoteSection;
