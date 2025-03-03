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

export interface LocationType {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface Status {
  id: string;
  name: string;
  statusDate?: string; // Optional as it's only present in location
}

export interface Metadata {
  createdBy?: string; // Made optional because location.metadata is sometimes empty
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  locationType: LocationType;
  status: Status;
  metadata: Metadata; // Location metadata now included
}

export interface WarehouseDetails {
  id: string;
  name: string;
  storageCapacity: number; // Added this missing field
  location: Location;
  status: Status;
  metadata: Metadata;
}

export interface WarehouseDetailsResponse {
  success: boolean;
  message: string;
  data: WarehouseDetails;
}
