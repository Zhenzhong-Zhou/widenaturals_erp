import type { ApiSuccessResponse, AsyncState } from "@shared-types/api";

/**
 * Represents a single item in a sales order.
 */
export interface OrderItemInput {
  /** The UUID of the SKU being ordered */
  sku_id: string;
  
  /** Optional UUID of the packaging material used for this item */
  packaging_material_id: string | null;
  
  /** The quantity of the SKU being ordered */
  quantity_ordered: number;
  
  /** The UUID of the price record associated with this item */
  price_id: string;
  
  /** The price per unit of the SKU */
  price: number;
}

/**
 * Input payload for creating a new sales order.
 */
export interface CreateSalesOrderInput {
  /** The UUID of the order type (e.g., sales, transfer) */
  order_type_id: string;
  
  /** The date the order was placed (ISO 8601 format) */
  order_date: string;
  
  /** Optional notes or remarks associated with the order */
  note?: string;
  
  /** The UUID of the customer placing the order */
  customer_id: string;
  
  /** The UUID of the shipping address */
  shipping_address_id: string;
  
  /** The UUID of the billing address */
  billing_address_id: string;
  
  /** The UUID of the selected payment method */
  payment_method_id: string;
  
  /** The currency code used in this order (e.g., USD, CAD) */
  currency_code: string;
  
  /** The exchange rate applied if currency differs from base */
  exchange_rate: number;
  
  /** Optional UUID of any discount applied to the order */
  discount_id?: string;
  
  /** The UUID of the applicable tax rate */
  tax_rate_id: string;
  
  /** Shipping fee applied to the order */
  shipping_fee: number;
  
  /** The UUID of the delivery method used for this order */
  delivery_method_id: string;
  
  /** List of items included in the order */
  order_items: OrderItemInput[];
}

/**
 * Extended form type used for sales order creation UI.
 *
 * Combines backend `CreateSalesOrderInput` with additional UI-only fields
 * that are relevant only on the client side (e.g., toggle switches or labels).
 *
 * - `billing_same_as_shipping`: Determines if billing address should default to shipping address.
 * - `address_section_label`: Optional label for the address section in the form UI.
 * - `address_placeholder`: Optional placeholder text for address fields in the form UI.
 *
 * These extra fields should be stripped out before submitting to the backend.
 */
export type CreateSalesOrderForm = CreateSalesOrderInput & {
  billing_same_as_shipping: boolean;
  address_section_label?: string;
  address_placeholder?: string;
};

/**
 * Payload returned when a sales order is successfully created.
 */
export interface CreateSalesOrderData {
  /**
   * The UUID of the order.
   */
  orderId: string;
}

/**
 * Response format for a successful sales order creation.
 */
export type CreateSalesOrderResponse = ApiSuccessResponse<CreateSalesOrderData>;

/**
 * State structure for managing the sales order creation lifecycle.
 *
 * Wraps the creation result (i.e., the newly created order ID) in a generic AsyncState,
 * including loading and error status.
 *
 * Used in Redux slices and components that handle the creation of sales orders.
 */
export type SalesOrderCreationState = AsyncState<CreateSalesOrderData | null>;

/**
 * Information about the user who created or last updated a record.
 * Originates from `makeAudit` / `compactAudit` utilities.
 */
export interface AuditUser {
  /** The unique identifier of the user, or null if unavailable */
  id: string | null;
  /** The display name of the user, or null if unavailable */
  name: string | null;
}

/**
 * Audit metadata for a resource, containing creation and last update info.
 */
export interface Audit {
  /** ISO date string when the record was created, or null */
  createdAt: string | null;
  /** User information for the creator */
  createdBy: AuditUser;
  /** ISO date string when the record was last updated, or null */
  updatedAt?: string | null;
  /** User information for the last updater */
  updatedBy?: AuditUser;
}

/**
 * Public-facing address object for orders (BuiltAddressUserFacing).
 */
export interface Address {
  /** Unique identifier for the address */
  id: string;
  /** Associated customer ID or null if not linked */
  customerId: string | null;
  /** Full name of the contact */
  fullName: string | null;
  /** Contact phone number */
  phone: string | null;
  /** Contact email address */
  email: string | null;
  /** Custom label for the address (e.g., "Home", "Warehouse") */
  label: string | null;
  /** Fully formatted address string, if provided by server */
  formatted?: string;
}

/**
 * Represents the payment status of an order (e.g., UNPAID, PAID).
 */
export interface PaymentStatus {
  /** Unique identifier for the payment status */
  id: string | null;
  /** Human-readable name of the payment status */
  name: string | null;
}

/**
 * Represents the payment method used for an order.
 */
export interface PaymentMethod {
  /** Unique identifier for the payment method */
  id: string | null;
  /** Human-readable name of the payment method */
  name: string | null;
}

/**
 * Payment details for an order.
 */
export interface Payment {
  /** Payment status */
  status: PaymentStatus;
  /** Payment method */
  method: PaymentMethod;
  /** 3-letter currency code (e.g., "USD", "CAD") */
  currencyCode: string | null;
  /** Exchange rate as a string (e.g., "1.4100") */
  exchangeRate: string | null;
  /** Base currency amount as a string */
  baseCurrencyAmount: string | null;
}

/**
 * Discount applied to the order.
 */
export interface Discount {
  /** Unique identifier of the discount */
  id: string;
  /** Name of the discount */
  name: string;
  /** Preformatted label (e.g., "$20.00") */
  label: string;
  /** Discount amount as a string */
  amount: string;
}

/**
 * Tax applied to the order.
 */
export interface Tax {
  /** Unique identifier of the tax */
  id: string;
  /** Preformatted tax name (e.g., "PST (7.00%) - BC") */
  name: string;
  /** Tax amount as a string */
  amount: string;
}

/**
 * Delivery method for the order.
 */
export interface DeliveryMethod {
  /** Unique identifier of the delivery method */
  id: string | null;
  /** Human-readable name of the delivery method */
  name: string | null;
}

/**
 * SKU reference for an order item.
 */
export interface SkuRef {
  /** Unique SKU identifier */
  id: string;
  /** SKU code */
  code: string;
  /** Product barcode, if available */
  barcode: string | null;
}

/**
 * Packaging material reference for an order item.
 */
export interface PackagingMaterialRef {
  /** Unique identifier for the packaging material */
  id: string;
  /** Packaging material code */
  code: string;
  /** Human-readable name for display */
  name: string;
}

/**
 * Status of an individual order item.
 */
export interface OrderItemStatus {
  /** Unique identifier for the status */
  id: string | null;
  /** Human-readable name of the status */
  name: string | null;
  /** ISO date string when the status was set, or null */
  date: string | null;
}

/**
 * Represents an individual line item in an order.
 * Each item is either a SKU line or a packaging material line.
 */
export interface OrderItem {
  /** Unique identifier for the order item */
  id: string;
  /** The parent order ID */
  orderId: string;
  /** Quantity ordered */
  quantityOrdered: number;
  /** Product barcode */
  barcode: string;
  /** Linked price ID (if applicable) */
  priceId: string | null;
  /** Listed price as a string */
  listedPrice: string | null;
  /** Price type name (e.g., "Retail", "Wholesale") */
  priceTypeName: string | null;
  /** Final price applied as a string */
  price: string | null;
  /** Subtotal for this line item as a string */
  subtotal: string | null;
  /** Current status of the order item */
  status: OrderItemStatus;
  /** Optional metadata object */
  metadata?: Record<string, unknown> | null;
  /** SKU reference (null if this is a packaging material line) */
  sku: SkuRef | null;
  /** Packaging material reference (null if this is a SKU line) */
  packagingMaterial: PackagingMaterialRef | null;
  /** Audit metadata */
  audit: Audit;
  /** Optional display name for SKU lines */
  displayName?: string;
}

/**
 * Represents a transformed order with all details included.
 */
export interface TransformedOrder {
  /** Unique identifier for the order */
  id: string;
  /** Order number string */
  orderNumber: string;
  /** ISO date string for when the order was placed */
  orderDate: string | null;
  /** ISO date string for last status change */
  statusDate: string | null;
  /** Optional order note */
  note: string | null;
  /** Order type reference */
  type: { id: string; name: string };
  /** Order status reference */
  status: { id: string | null; name: string | null };
  /** Customer details */
  customer: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  };
  /** Payment details */
  payment: Payment;
  /** Discount applied to the order, if any */
  discount: Discount | null;
  /**
   * The subtotal for all order items (before discount, tax, and shipping).
   * May be `null` if not yet calculated.
   */
  subtotal: number | null;
  /** Tax applied to the order, if any */
  tax: Tax | null;
  /** Shipping fee as a string */
  shippingFee: string | null;
  /** Total order amount as a string */
  totalAmount: string | null;
  /** Delivery method */
  deliveryMethod: DeliveryMethod;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** Shipping address */
  shippingAddress: Address | null;
  /** Billing address */
  billingAddress: Address | null;
  /** Audit metadata */
  audit: Audit;
  /** Array of order line items */
  items: OrderItem[];
}

/**
 * Successful API response wrapper for fetching order details.
 */
export type GetOrderDetailsResponse = ApiSuccessResponse<TransformedOrder>;

/**
 * Redux state shape for the order details feature.
 *
 * This type extends the generic `AsyncState<T>` to track:
 * - `data`: The transformed order object for the currently viewed order, or `null` if none loaded.
 * - `loading`: Boolean indicating whether a fetch is in progress.
 * - `error`: Any error object/string from the last failed fetch, or `null` if none.
 *
 * @template T - The shape of the underlying data (here: `TransformedOrder | null`).
 *
 * Example usage:
 * const initialState: OrderDetailsState = {
 *   data: null,
 *   loading: false,
 *   error: null,
 * };
 */
export type OrderDetailsState = AsyncState<TransformedOrder | null>;

/**
 * Route parameters used in order-related routes.
 *
 * These parameters are typically extracted from dynamic route paths such as:
 *   /orders/:category/details/:orderId
 *
 * @property category - The order category (e.g., 'sales', 'purchase').
 * @property orderId  - (Optional) The unique identifier of the order.
 */
export type OrderRouteParams = {
  category: string;
  orderId?: string;
};
