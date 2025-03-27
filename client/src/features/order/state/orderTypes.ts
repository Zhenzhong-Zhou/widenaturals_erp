// Order type structure for dropdown
export interface OrderType {
  id: string;
  name: string;
  category: string;
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
  discount_id: string | null; // Optional
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
