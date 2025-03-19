// Order type structure for dropdown
export interface OrderType {
  id: string;
  name: string;
}

// Type for an order item
export interface OrderItem {
  product_id: string;
  price_type_id: string;
  price: number;
  quantity_ordered: number;
}

// Type for the sales order
export interface SalesOrder {
  customer_id: string;
  order_date: string; // ISO Date string (YYYY-MM-DD)
  discount_id?: string; // Optional
  tax_rate_id: string;
  delivery_method_id: string;
  note?: string; // Optional
  items: OrderItem[]; // Array of order items
}

// Order Creation Response Interface
export interface CreateSalesOrderResponse {
  success: boolean;
  message: string;
  salesOrderId: string;
}
