import type {
  ApiSuccessResponse,
  AsyncState,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState, SortConfig,
} from '@shared-types/api';

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
 * Filters used to query and paginate the list of orders.
 *
 * This interface supports both:
 * - User-provided filters (from search UI, dropdowns, or query params).
 * - System-applied filters (e.g., access control scoped by type or status).
 *
 * Fields like `orderTypeId` and `orderStatusId` may be added dynamically
 * during access control evaluation (e.g., in `applyOrderAccessFilters`).
 */
export interface OrderListFilters {
  /**
   * Free-text keyword for fuzzy search (e.g., customer name, SKU, order notes).
   */
  keyword?: string;
  
  /**
   * Filter by exact order number (must match precisely).
   */
  orderNumber?: string;
  
  /**
   * Logical order category code (e.g., 'sales', 'purchase', 'transfer').
   * Used to scope status filtering and type mapping.
   */
  orderCategory?: string;
  
  /**
   * Filter by one or more order type UUIDs.
   * This may be user-provided or applied via access control.
   */
  orderTypeId?: string | string[];
  
  /**
   * Filter by one or more order status UUIDs.
   * This may be user-provided or injected from access stage control.
   */
  orderStatusId?: string | string[];
  
  /**
   * Filter for orders created after this ISO date (inclusive).
   * Example: '2025-01-01T00:00:00Z'
   */
  createdAfter?: string;
  
  /**
   * Filter for orders created before this ISO date (inclusive).
   * Example: '2025-12-31T23:59:59Z'
   */
  createdBefore?: string;
  
  /**
   * Filter for orders whose status last changed after this ISO date (inclusive).
   */
  statusDateAfter?: string;
  
  /**
   * Filter for orders whose status last changed before this ISO date (inclusive).
   */
  statusDateBefore?: string;
  
  /**
   * Filter for orders created by a specific user (UUID).
   */
  createdBy?: string;
  
  /**
   * Filter for orders last updated by a specific user (UUID).
   */
  updatedBy?: string;
}

/**
 * Query parameters used to fetch a paginated, sorted, and filtered list of orders.
 *
 * Includes:
 * - Pagination:
 *    - `page`: current page number
 *    - `limit`: number of records per page
 * - Sorting:
 *    - `sortBy`: field to sort by (e.g., 'createdAt', 'orderNumber')
 *    - `sortOrder`: sorting direction ('ASC' or 'DESC')
 * - Filters (`filters` object):
 *    - Text search:
 *       - `keyword`: free-text search (e.g., customer name, SKU, notes)
 *       - `orderNumber`: exact match for order number
 *    - Metadata:
 *       - `orderTypeId`: filter by order type (UUID)
 *       - `orderStatusId`: filter by order status (UUID)
 *    - Date ranges:
 *       - `createdAfter` / `createdBefore`: filter by order creation date (ISO string)
 *       - `statusDateAfter` / `statusDateBefore`: filter by status update date (ISO string)
 *    - Audit fields:
 *       - `createdBy` / `updatedBy`: filter by user UUIDs
 */
export interface OrderQueryParams extends PaginationParams, SortConfig {
  filters?: OrderListFilters;
}

/**
 * Allowed fields for sorting the order list.
 */
export type OrderListSortField =
  | 'orderNumber'
  | 'orderDate'
  | 'orderType'
  | 'statusName'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'defaultNaturalSort';

/**
 * Represents a single order in the paginated order list response.
 */
export interface OrderListItem {
  /** Unique ID of the order (UUID) */
  id: string;
  
  /** Human-readable order number (e.g., SO-20230821-XYZ) */
  orderNumber: string;
  
  /** Name of the order type (e.g., Standard Sales Order) */
  orderType: string;
  
  /**
   * Current order status.
   * - `code`: Machine-readable code (e.g., 'ORDER_PENDING')
   * - `name`: Human-readable label (e.g., 'Pending')
   */
  orderStatus: {
    code: string;
    name: string
  };
  
  /**
   * Date when the order was placed (ISO 8601 string).
   * Typically, represents the customer's intended order date.
   * Example: '2025-08-25T00:00:00.000Z'
   */
  orderDate: string;
  
  /** Date when the current status was last updated (ISO string) */
  statusDate: string;
  
  /** Timestamp when the order was created (ISO string) */
  createdAt: string;
  
  /** Name of the user who created the order */
  createdBy: string;
  
  /** Timestamp when the order was last updated (ISO string) */
  updatedAt: string;
  
  /** Name of the user who last updated the order */
  updatedBy: string;
  
  /** Optional note or comment attached to the order */
  note?: string | null;
  
  /** Full name of the associated customer, if available */
  customerName?: string | null;
  
  /** Name of the payment method used (e.g., Credit Card) */
  paymentMethod?: string | null;
    
    /**
     * Current payment status.
     * - `code`: Machine-readable code (e.g., 'PAID', 'UNPAID')
     * - `name`: Human-readable label (e.g., 'Paid', 'Unpaid')
     */
    paymentStatus: {
      code: string;
      name: string;
    };
  
  /** Name of the delivery method (e.g., Canada Post) */
  deliveryMethod?: string | null;
  
  /** Number of items linked to this order */
  numberOfItems: number;
}

/**
 * Paginated response containing a list of orders and pagination metadata.
 */
export type OrderListResponse = PaginatedResponse<OrderListItem>;

/**
 * Redux state shape for managing a paginated list of orders with applied filters.
 *
 * Extends the generic `ReduxPaginatedState` using `OrderListItem` as the item type
 * and includes a `filters` field to track the currently applied query parameters.
 *
 * This interface is typically used for managing order list views with pagination,
 * server-side filtering, loading indicators, and error handling.
 */
export interface PaginatedOrderStateWithFilters extends ReduxPaginatedState<OrderListItem> {
  filters: OrderQueryParams;
}

export interface PermissionContext {
  isRoot: boolean;
  has: (perm: string) => boolean;
  hasAny: (perms: string[]) => boolean;
}

/**
 * Information about the user who created or last updated a record.
 * Originates from `makeAudit` / `compactAudit` utilities.
 */
export interface AuditUser {
  /** The unique identifier of the user, or null if unavailable */
  id: string | null;
  /** The display name of the user, or null if unavailable */
  name: string;
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
 * Represents the payment status of an order.
 *
 * Includes metadata such as:
 * - `id`: Unique identifier of the payment status
 * - `code`: System code (e.g., "PAID", "UNPAID")
 * - `name`: Human-readable label (e.g., "Paid", "Unpaid")
 */
export interface PaymentStatus {
  /** Unique identifier of the payment status */
  id: string | null;
  /** System code (e.g., "PAID", "UNPAID") */
  code: string | null;
  /** Human-readable label (e.g., "Paid", "Unpaid") */
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
 * Represents the current status of an individual order item.
 *
 * Includes metadata such as:
 * - `id`: Unique identifier for the status
 * - `code`: System code (e.g., "ORDER_ALLOCATED", "ORDER_SHIPPED")
 * - `name`: Human-readable label (e.g., "Allocated", "Shipped")
 * - `date`: ISO timestamp indicating when this status was set
 */
export interface OrderItemStatus {
  /** Unique identifier for the status */
  id: string | null;
  
  /** System code of the status (e.g., "ORDER_ALLOCATED") */
  code: string | null;
  
  /** Human-readable name of the status (e.g., "Allocated") */
  name: string | null;
  
  /** ISO date string indicating when the status was applied */
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
  type: { id: string; name: string; code: string; };
  /** Order status reference */
  status: { id: string | null; name: string | null; code: string | null };
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

/**
 * A flattened view of a sales order header used for UI rendering.
 * This structure simplifies nested fields from the backend `TransformedOrder` model
 * into a flat and consistent shape for detail components.
 */
export interface FlattenedOrderHeader {
  /** Unique order number (human-readable) */
  orderNumber: string;
  
  /** Date the order was created or placed */
  orderDate: string | null;
  
  /** Optional note or memo attached to the order */
  orderNote: string;
  
  /**
   * Current status of the order.
   *
   * Includes:
   * - `code`: Status code (e.g., "ORDER_PENDING", "ORDER_SHIPPED")
   * - `name`: Human-readable label (e.g., "Pending", "Shipped")
   */
  orderStatus: {
    code: string;
    name: string;
  };
  
  /** Date when the order status was last updated */
  orderStatusDate: string | null;
  
  /** Order type name (e.g., Sale, Return, Transfer) */
  orderType: string | null;
  
  /** Payment-related information */
  paymentInfo: {
    /** Payment method name (e.g., Credit Card, Bank Transfer) */
    method: string | null;
    
    /** Human-readable payment status (e.g., "Paid") */
    status: string | null;
    
    /** System-defined status code (e.g., "PAID") */
    code: string | null;
    
    /** Currency code used for the transaction (e.g., USD, CAD) */
    currencyCode: string | null;
    
    /** Exchange rate from base to target currency, if applicable */
    exchangeRate: number | null;
    
    /** Order total in base currency */
    baseCurrencyAmount: number | null;
  };
  
  /** Discount name or code applied to the order */
  discount: string | null;
  
  /** User-friendly discount label for display */
  discountLabel: string | null;
  
  /** Total discount amount */
  discountAmount: number | null;
  
  /** Order subtotal before tax, shipping, and discounts */
  subtotal: number | null;
  
  /** Tax rate name or label (e.g., GST, VAT) */
  taxRate: string | null;
  
  /** Total tax amount applied */
  taxAmount: number | null;
  
  /** Delivery method info (e.g., Pickup, Courier) */
  deliveryInfo: {
    /** Name of the delivery method */
    method: string | null;
  };
  
  /** Shipping address and contact details */
  shippingInfo: {
    /** Full name of the shipping recipient */
    shippingFullname: string;
    
    /** Phone number of the recipient */
    shippingPhone: string;
    
    /** Email of the shipping contact */
    shippingEmail: string;
    
    /** Formatted shipping address string */
    address: string;
  };
  
  /** Billing address and contact details */
  billingInfo: {
    /** Full name of the billing contact */
    billingFullname: string;
    
    /** Phone number of the billing contact */
    billingPhone: string;
    
    /** Email of the billing contact */
    billingEmail: string;
    
    /** Formatted billing address string */
    address: string;
  };
  
  /** Full name of the customer placing the order */
  customerName: string;
  
  /** Customer’s email address */
  customerEmail: string;
  
  /** Customer’s phone number */
  customerPhone: string;
  
  /** Metadata about who created/updated the order */
  auditInfo: {
    /** Order creation timestamp */
    createdAt: string;
    
    /** Creator details (ID and name) */
    createdBy: { id: string | null; name: string } | null;
    
    /** Last update timestamp */
    updatedAt: string;
    
    /** Updater details (ID and name) */
    updatedBy: { id: string | null; name: string } | null;
  };
  
  /** Additional order-level metadata for custom logic or display */
  orderMetadata: Record<string, any>;
}

/**
 * Represents the status information of an order.
 */
export interface OrderStatusInfo {
  /** Unique identifier of the order */
  id: string;
  
  /** Identifier of the order status (foreign key) */
  order_status_id: string;
  
  /** Timestamp when the status was set (ISO 8601 format) */
  status_date: string;
  
  /** Human-readable name of the order status */
  statusName: string;
  
  /** Machine-readable code representing the order status */
  statusCode: string;
  
  /** High-level category of the status (e.g., 'processing', 'completed') */
  statusCategory: string;
}

/**
 * Represents the status information of an individual order item.
 */
export interface OrderItemStatusInfo {
  /** Unique identifier of the order item */
  id: string;
  
  /** Identifier of the item's status (foreign key) */
  status_id: string;
  
  /** Timestamp when the status was set (ISO 8601 format) */
  status_date: string;
  
  /** Human-readable name of the item status */
  statusName: string;
  
  /** Machine-readable code representing the item status */
  statusCode: string;
  
  /** High-level category of the status (e.g., 'processing', 'completed') */
  statusCategory: string;
}

/**
 * Payload returned in the `data` field when updating an order's status.
 */
export interface UpdateOrderStatusData {
  /** The updated status information of the order */
  order: OrderStatusInfo;
  
  /** A list of updated status information for each order item */
  items: OrderItemStatusInfo[];
}

/**
 * Full API response when updating an order's status, extending the generic success response.
 */
export interface UpdateOrderStatusResponse extends ApiSuccessResponse<UpdateOrderStatusData> {
  /**
   * Additional metadata about the status update operation.
   */
  meta: {
    /** Whether the main order status was updated */
    orderUpdated: boolean;
    
    /** Number of order items whose statuses were updated */
    itemsUpdated: number;
    
    /** Total number of records affected (order + items) */
    recordsUpdated: number;
  };
}

/**
 * Represents the async state for updating an order's status.
 *
 * This state includes the loading flag, potential error message,
 * and the response payload returned after successfully updating
 * an order and its associated items.
 *
 * The `data` field is typed as `UpdateOrderStatusResponse | null`
 * to account for the initial, loading, or error state.
 */
export type UpdateOrderStatusState = AsyncState<UpdateOrderStatusResponse | null>;
