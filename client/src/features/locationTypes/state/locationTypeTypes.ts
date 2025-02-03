export interface LocationType {
  location_type_id: string;
  location_type_name: string;
  location_type_description: string;
  status_id: string;
  status_name: string;
  status_date: string; // ISO Timestamp
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
  created_by: string;
  updated_by: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface LocationTypesData {
  data: LocationType[];
  pagination: Pagination;
}

export interface LocationTypesResponse {
  success: boolean;
  message: string;
  data: LocationTypesData;
}

// Location Interface (Represents each location within a location type)
export interface Location {
  location_id: string;
  location_name: string;
  address: string;
  warehouse_fee: number;
  status_id: string;
  status_name: string;
  status_date: string; // ISO Timestamp
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
  created_by: string;
  updated_by: string;
}

// Location Type Detail Interface (Represents details of a location type)
export interface LocationTypeDetail extends LocationType {
  locations: Location[];
}

// API Response Interface (Represents the full response structure)
export interface LocationTypeResponse {
  success: boolean;
  message: string;
  locationTypeDetail: LocationTypeDetail;
  pagination: Pagination;
}
