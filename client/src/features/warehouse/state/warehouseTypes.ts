// Warehouse Type
export interface Warehouse {
  id: string;
  warehouse_name: string;
  location_name: string;
  storage_capacity: number;
  status_name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Pagination Type
export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// API Response Type
export interface WarehouseResponse {
  success: boolean;
  message: string;
  warehouses: Warehouse[];
  pagination: Pagination;
}
