import type {
  AuditUser,
  FlattenedOrderHeader,
  TransformedOrder,
} from '../state';

const normalizeAuditUser = (user?: AuditUser): AuditUser => ({
  id: user?.id ?? null,
  name: user?.name ?? '-',
});

export const flattenSalesOrderHeader = (
  raw: TransformedOrder
): FlattenedOrderHeader => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid order header passed to flattenSalesOrderHeader');
  }

  return {
    orderNumber: raw.orderNumber,
    orderDate: raw.orderDate,
    orderNote: raw.note || '',
    orderStatus: {
      name: raw.status?.name || '',
      code: raw.status?.code || '',
    },
    orderStatusDate: raw.statusDate || null,
    orderType: raw.type?.name || null,

    paymentInfo: {
      method: raw.payment?.method?.name || null,
      status: raw.payment?.status?.name || null,
      code: raw.payment?.status?.code || null,
      currencyCode: raw.payment?.currencyCode || null,
      exchangeRate:
        raw.payment?.exchangeRate != null
          ? Number(raw.payment.exchangeRate)
          : null,
      baseCurrencyAmount:
        raw.payment?.baseCurrencyAmount != null
          ? Number(raw.payment.baseCurrencyAmount)
          : null,
    },

    discount: raw.discount?.name || null,
    discountLabel: raw.discount?.label || null,
    discountAmount:
      raw.discount?.amount != null ? Number(raw.discount.amount) : null,
    subtotal: raw.subtotal || null,

    taxRate: raw.tax?.name || null,
    taxAmount: raw.tax?.amount != null ? Number(raw.tax.amount) : null,

    deliveryInfo: {
      method: raw.deliveryMethod?.name || null,
    },

    shippingInfo: {
      shippingFullname: raw.shippingAddress?.fullName || '',
      shippingPhone: raw.shippingAddress?.phone || '',
      shippingEmail: raw.shippingAddress?.email || '',
      address: raw.shippingAddress?.formatted || '',
    },

    billingInfo: {
      billingFullname: raw.billingAddress?.fullName || '',
      billingPhone: raw.billingAddress?.phone || '',
      billingEmail: raw.billingAddress?.email || '',
      address: raw.billingAddress?.formatted || '',
    },

    customerName: raw.customer?.fullName || '',
    customerEmail: raw.customer?.email || '',
    customerPhone: raw.customer?.phone || '',

    auditInfo: {
      createdAt: raw.audit?.createdAt ?? '-',
      createdBy: normalizeAuditUser(raw.audit?.createdBy),
      updatedAt: raw.audit?.updatedAt ?? '-',
      updatedBy: normalizeAuditUser(raw.audit?.updatedBy),
    },

    orderMetadata: raw.metadata || {},
  };
};
