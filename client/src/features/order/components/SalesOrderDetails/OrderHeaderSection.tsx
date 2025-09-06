import type { FC } from 'react';
import Section from '@components/layout/Section';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import type { FlattenedOrderHeader } from '@features/order/state';
import { formatLabel } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import { formatOrderStatus, formatPaymentStatus } from '@utils/formatters';

interface OrderHeaderSectionProps {
  flattened: FlattenedOrderHeader;
}

const OrderHeaderSection: FC<OrderHeaderSectionProps> = ({ flattened }) => {
  return (
    <Section title={"Order Info"}>
      <DetailsGrid>
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Order Number', value: flattened.orderNumber },
              { label: 'Order Type', value: flattened.orderType, format: formatLabel },
              { label: 'Order Date', value: flattened.orderDate, format: formatDate },
              { label: 'Delivery Method', value: flattened.deliveryInfo.method, format: formatLabel },
            ]}
          />
        </DetailsGridItem>
        
        <DetailsGridItem>
          <MemoizedDetailsSection
            fields={[
              { label: 'Order Status', value: flattened.orderStatus, format: formatOrderStatus },
              { label: 'Status Date', value: flattened.orderStatusDate, format: formatDate },
              { label: 'Payment Method', value: flattened.paymentInfo.method, format: formatLabel },
              { label: 'Payment Status', value: flattened.paymentInfo.status, format: formatPaymentStatus },
            ]}
          />
        </DetailsGridItem>
      </DetailsGrid>
    </Section>
  );
};

export default OrderHeaderSection;
