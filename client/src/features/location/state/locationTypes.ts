// Represents a single location
export interface Location {
  location_id: string;
  location_name: string;
  address: string;
  status_id: string;
  status_name: string;
  status_date: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  created_by: string;
  updated_by: string;
  location_type_id: string;
  location_type_name: string;
  is_high_fee_warehouse: boolean; // Business logic field
}

// Represents pagination metadata
export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// Represents the API response structure
export interface LocationResponse {
  success: boolean;
  message: string;
  locations: Location[];
  pagination: Pagination;
}
