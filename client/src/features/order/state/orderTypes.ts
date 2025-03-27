// Order type structure for dropdown
export interface OrderType {
  id: string;
  name: string;
  category: string;
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
  system_price: string;  // Always included
  adjusted_price?: string;  // Optional: Only included if different from system_price
  order_item_status_name: string; // Example: "Pending"
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
export interface OrderData {
  order_id: string;
  order_number: string;
  order_category: string; // Example: "sales"
  order_type: string; // Example: "Standard Sales Order"
  order_date: string | { order_date: string; sales_order_date: string }; // Handle both single date and object
  customer_name: string;
  order_status: string; // Example: "Pending"
  discount_amount: string | null; // Example: "2520.00" or null
  subtotal: string;
  tax_rate: string; // Percentage as a string, e.g., "15.00"
  tax_amount: string;
  shipping_fee: string;
  total_amount: string;
  order_note: string;
  order_metadata: Record<string, any> | null; // Allowing null values as well
  delivery_info: DeliveryInfo; // Delivery Information with method & tracking info
  items: FetchedOrderItem[]; // Array of Order Items
  discount?: string; // Example: "15.00%"
}

// Full Response Type
export interface OrderResponse {
  success: boolean;
  message: string;
  data: OrderData;
}
