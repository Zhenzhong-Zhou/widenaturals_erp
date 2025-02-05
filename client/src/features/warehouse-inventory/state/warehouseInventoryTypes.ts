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
