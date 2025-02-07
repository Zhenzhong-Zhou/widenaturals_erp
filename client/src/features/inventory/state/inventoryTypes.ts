// Interface for a single inventory item
export interface InventoryItem {
  inventory_id: string;
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  item_type: string;
  lot_number: string;
  identifier: string;
  quantity: number;
  manufacture_date: string; // ISO Timestamp
  expiry_date: string; // ISO Timestamp
  warehouse_fee: number;
  inbound_date: string; // ISO Timestamp
  outbound_date: string | null; // ISO Timestamp or null
  last_update: string; // ISO Timestamp
  status_id: string;
  status_name: string;
  status_date: string; // ISO Timestamp
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
  created_by: string;
  updated_by: string;
  is_expired: boolean;
}

// Pagination Interface
export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// API Response Interface for Inventory
export interface InventoryResponse {
  success: boolean;
  message: string;
  processedData: InventoryItem[];
  pagination: Pagination;
}
