import type {
  AuditUser,
  FlattenedOrderHeader,
  OrderAggregate,
} from '../state';
import { AppError } from '@utils/error';

/**
 * normalizeAuditUser
 *
 * Normalizes an audit user object into a stable, UI-safe shape.
 * Ensures audit fields never render as undefined in the UI by
 * applying safe fallbacks for missing values.
 *
 * @param user - Raw audit user object (may be undefined)
 * @returns Normalized audit user with stable id and display name
 */
const normalizeAuditUser = (user?: AuditUser): AuditUser => ({
  id: user?.id ?? null,
  name: user?.name ?? '-',
});

/**
 * normalizeSalesOrderHeader
 *
 * Transforms a raw `OrderAggregate` domain object into a
 * `FlattenedOrderHeader` UI model.
 *
 * Responsibilities:
 * - Flatten nested domain structures (status, payment, addresses, audit)
 * - Normalize numeric fields into numbers
 * - Apply safe defaults for missing or optional values
 * - Produce a UI-ready, non-optional header model
 *
 * This function is intended to be used at the **API → UI boundary**
 * (e.g. inside service adapters or thunks). It should NOT be called
 * from pages or presentation components.
 *
 * @throws AppError.validation if the input is invalid or not an object
 *
 * @param raw - Raw order aggregate returned from the backend
 * @returns Flattened, UI-safe order header model
 */
export const normalizeSalesOrderHeader = (
  raw: OrderAggregate
): FlattenedOrderHeader => {
  if (!raw || typeof raw !== 'object') {
    throw AppError.validation(
      'Invalid order header passed to normalizeSalesOrderHeader'
    );
  }
  
  return {
    /** Core order info */
    orderNumber: raw.orderNumber,
    orderDate: raw.orderDate,
    orderNote: raw.note || '',
    orderStatus: {
      name: raw.status?.name || '',
      code: raw.status?.code || '',
    },
    orderStatusDate: raw.statusDate || null,
    orderType: raw.type?.name || null,
    
    /** Payment information */
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
    
    /** Discount and pricing */
    discount: raw.discount?.name || null,
    discountLabel: raw.discount?.label || null,
    discountAmount:
      raw.discount?.amount != null ? Number(raw.discount.amount) : null,
    
    subtotal: raw.subtotal ?? null,
    
    taxRate: raw.tax?.name || null,
    taxAmount:
      raw.tax?.amount != null ? Number(raw.tax.amount) : null,
    
    shippingFee:
      raw.shippingFee != null ? Number(raw.shippingFee) : null,
    
    totalAmount:
      raw.totalAmount != null ? Number(raw.totalAmount) : null,
    
    /** Delivery and address info */
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
    
    /** Customer info */
    customerName: raw.customer?.fullName || '',
    customerEmail: raw.customer?.email || '',
    customerPhone: raw.customer?.phone || '',
    
    /** Audit info */
    auditInfo: {
      createdAt: raw.audit?.createdAt ?? '-',
      createdBy: normalizeAuditUser(raw.audit?.createdBy),
      updatedAt: raw.audit?.updatedAt ?? '-',
      updatedBy: normalizeAuditUser(raw.audit?.updatedBy),
    },
    
    /** Arbitrary metadata for UI interpretation */
    orderMetadata: raw.metadata || {},
  };
};
