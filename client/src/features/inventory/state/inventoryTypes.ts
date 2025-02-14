// Interface for a single inventory item
export interface InventoryItem {
  inventory_id: string;
  product_id: string;
  product_name: string;
  location_id: string;
  location_name: string;
  warehouse_id: string;
  warehouse_name: string;
  item_type: string;
  identifier: string;
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
  warehouse_fee: number;
  reserved_quantity: number;
  available_quantity: number;
  total_lots: number;
  total_lot_quantity: number;
  earliest_manufacture_date: string; // ISO Timestamp
  nearest_expiry_date: string; // ISO Timestamp
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
