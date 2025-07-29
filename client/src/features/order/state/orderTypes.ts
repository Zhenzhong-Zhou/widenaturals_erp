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
  
  /** The UUID of the payment status (e.g., pending, paid) */
  payment_status_id: string;
  
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
