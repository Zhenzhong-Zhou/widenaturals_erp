import type { FC } from 'react';
import Section from '@components/layout/Section';
import { OrderSummarySection } from '@features/order/components/SalesOrderDetails/index';

interface OrderTotalsSectionProps {
  subtotal: number;
  discount: number;
  taxRate: string;
  tax: number;
  shipping: number;
  total: number;
  baseCurrencyAmount: number;
}

const OrderTotalsSection: FC<OrderTotalsSectionProps> = ({
  subtotal,
  discount,
  taxRate,
  tax,
  shipping,
  total,
  baseCurrencyAmount,
}) => (
  <Section title="Order Totals">
    <OrderSummarySection
      subtotal={subtotal}
      discount={discount}
      taxRate={taxRate}
      tax={tax}
      shipping={shipping}
      total={total}
      baseCurrencyAmount={baseCurrencyAmount}
    />
  </Section>
);

export default OrderTotalsSection;
