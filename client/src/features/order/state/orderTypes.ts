// Order type structure for dropdown
export interface OrderType {
  id: string;
  name: string;
  category: string;
}

// Shipping Info
export interface ShippingInformation {
  shipping_fullname?: string | null;
  shipping_phone?: string | null;
  shipping_email?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  shipping_region?: string | null;
}

// Type for an order item
export interface CreateOrderItem {
  product_id: string;
  price_type_id: string;
  price: number;
  quantity_ordered: number;
}

// Type for the sales order
export interface SalesOrder {
  customer_id: string;
  order_date: string; // ISO Date string (YYYY-MM-DD)
  discount_id: string | null; // Optional
  tax_rate_id: string;
  delivery_method_id: string;
  has_shipping_info: boolean;
  shipping_info?: ShippingInformation | null;
  note?: string; // Optional
  items: CreateOrderItem[]; // Array of order items
}

// Order Creation Response Interface
export interface CreateSalesOrderResponse {
  success: boolean;
  message: string;
  salesOrderId: string;
}

// Type for individual order
export type Order = {
  id: string;
  order_number: string;
  order_type: string;
  order_date: string;
  status: string;
  note: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  order_number_valid: boolean;
};

// Type for pagination details
export type OrderPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

// Interface for the response structure
export interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  pagination: OrderPagination;
}

// Type for parameters of fetching orders
export type FetchOrdersParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  verifyOrderNumbers?: boolean;
};

// Order Item Interface
export interface FetchedOrderItem {
  order_item_id: string;
  product_id: string;
  product_name: string;
  barcode: string;
  npn: string;
  quantity_ordered: number;
  price_type: string; // Example: "Retail"
  system_price: string; // Always included
  adjusted_price?: string; // Optional: Only included if different from system_price
  order_item_subtotal: number;
  order_item_status_name: string; // Example: "Pending"
  order_item_status_date: string;
}

// Delivery Info Interface
interface DeliveryInfo {
  method: string; // Example: "Delivery", "Store Pick-Up", etc.
  tracking_info: null | TrackingInfo; // null if no tracking info is available
}

// Tracking Info Interface (If available)
interface TrackingInfo {
  tracking_number: string;
  carrier: string;
  service_name: string;
  shipped_date: string;
}

// Order Data Interface
export interface OrderDetailsData {
  order_id: string;
  order_number: string;
  order_category: string;
  order_type: string;
  order_date: string | { order_date: string; sales_order_date: string };
  customer_name: string;
  order_status: string;
  discount_amount: string | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  shipping_fee: string;
  total_amount: string;
  order_note: string;
  order_metadata: Record<string, any> | null;
  delivery_info: DeliveryInfo;
  shipping_info: ShippingInformation | null; // <-- Add this (null if not applicable)
  items: FetchedOrderItem[];
  discount?: string;
}

// Full Response Type
export interface OrderDetailsResponse {
  success: boolean;
  message: string;
  data: OrderDetailsData;
}

export interface OrderStatusUpdateResult {
  orderId: string;
  updatedOrderCount: number;
  updatedItemCount: number;
}

export interface OrderStatusUpdateResponse {
  success: boolean;
  message: string;
  data: OrderStatusUpdateResult;
}
