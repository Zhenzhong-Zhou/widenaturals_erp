// Interface for a single inventory item
export interface InventoryItem {
  inventory_id: string;
  item_type: string;
  product_id: string;
  item_name: string;
  location_id: string;
  warehouse_id: string;
  place_name: string;
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
export interface AllInventoriesPagination {
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
  pagination: AllInventoriesPagination;
}

export interface InventorySummary {
  productId: string;
  itemName: string;
  totalInventoryEntries: number;
  recordedQuantity: number;
  actualQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  totalLots: number;
  lotQuantity: number;
  earliestManufactureDate: string | null;
  nearestExpiryDate: string | null;
  status: string;
  isNearExpiry: boolean;
  isLowStock: boolean;
  stockLevel: 'none' | 'critical' | 'low' | 'normal'; // optional but helpful for display logic
}

export interface InventorySummaryPagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface InventorySummaryResponse {
  success: boolean;
  message: string;
  data: InventorySummary[];
  pagination: InventorySummaryPagination;
}
