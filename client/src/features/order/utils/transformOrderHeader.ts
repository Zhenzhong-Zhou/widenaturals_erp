import type { AuditUser, TransformedOrder } from '../state';

const normalizeAuditUser = (user?: AuditUser): AuditUser => ({
  id: user?.id ?? null,
  name: user?.name ?? '-',
});

export const flattenSalesOrderHeader = (raw: TransformedOrder) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid order header passed to flattenSalesOrderHeader');
  }
  
  return {
    order_number: raw.orderNumber,
    order_date: raw.orderDate,
    order_note: raw.note || '',
    order_status: raw.status?.name || null,
    order_status_date: raw.statusDate || null,
    order_type: raw.type?.name || null,
    
    payment_info: {
      method: raw.payment?.method?.name || null,
      status: raw.payment?.status?.name || null,
      currency_code: raw.payment?.currencyCode || null,
      exchange_rate: raw.payment?.exchangeRate || null,
      base_currency_amount: raw.payment?.baseCurrencyAmount || null,
    },
    
    discount: raw.discount?.name || null,
    discount_label: raw.discount?.label || null,
    discount_amount: raw.discount?.amount || null,
    subtotal: raw.subtotal || null,
    
    tax_rate: raw.tax?.name || null,
    tax_amount: raw.tax?.amount || null,
    
    delivery_info: {
      method: raw.deliveryMethod?.name || null,
    },
    
    shipping_info: {
      shipping_fullname: raw.shippingAddress?.fullName || '',
      shipping_phone: raw.shippingAddress?.phone || '',
      shipping_email: raw.shippingAddress?.email || '',
      address: raw.shippingAddress?.formatted || '',
    },
    
    billing_info: {
      billing_fullname: raw.billingAddress?.fullName || '',
      billing_phone: raw.billingAddress?.phone || '',
      billing_email: raw.billingAddress?.email || '',
      address: raw.billingAddress?.formatted || '',
    },
    
    customer_name: raw.customer?.fullName || '',
    customer_email: raw.customer?.email || '',
    customer_phone: raw.customer?.phone || '',
    
    audit_info: {
      created_at: raw.audit?.createdAt ?? '-',
      created_by: normalizeAuditUser(raw.audit?.createdBy),
      updated_at: raw.audit?.updatedAt ?? '-',
      updated_by: normalizeAuditUser(raw.audit?.updatedBy),
    },
    
    order_metadata: raw.metadata || {},
  };
}
