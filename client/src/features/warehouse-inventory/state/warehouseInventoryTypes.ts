export interface WarehouseInventory {
  warehouse_inventory_id: string;
  warehouse_id: string;
  warehouse_name: string;
  storage_capacity: number;
  location_name: string;
  product_id: string;
  product_name: string;
  reserved_quantity: number;
  warehouse_fee: string;
  last_update: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface WarehouseInventoryResponse {
  success: boolean;
  message: string;
  inventories: WarehouseInventory[];
  pagination: Pagination;
}

export interface WarehouseInventorySummary {
  warehouseId: string;
  warehouseName: string;
  status: string;
  totalProducts: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalWarehouseFees: number;
  lastInventoryUpdate: string; // ISO Date String
  totalLots: number;
  earliestExpiry: string; // ISO Date String
  latestExpiry: string; // ISO Date String
  totalZeroStockLots: number;
}

export interface WarehouseInventorySummaryResponse {
  success: boolean;
  message: string;
  formattedSummary: WarehouseInventorySummary[];
  pagination: Pagination;
}

// Interface for a single product summary in a warehouse
export interface WarehouseProductSummary {
  productId: string;
  productName: string;
  totalLots: number;
  totalReservedStock: number;
  totalAvailableStock: number;
  totalZeroStockLots: number;
  earliestExpiry: string | null; // Can be null if no expiry date is set
  latestExpiry: string | null;
}


// Interface for the full API response
export interface WarehouseProductSummaryResponse {
  success: boolean;
  message: string;
  productSummaryData: WarehouseProductSummary[];
  pagination: Pagination;
}
