// Interface for a single PricingType
export interface PricingType {
  id: string;
  name: string;
  description: string;
  status: string;
  status_date: string;
  created_at: string;
  updated_at: string;
  created_by_fullname: string;
  updated_by_fullname: string;
}

// Interface for Pagination data
export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// Interface for the response structure
export interface PricingTypesResponse {
  success: boolean;
  data: PricingType[];
  pagination: Pagination;
}

export interface PricingTypeTableProps {
  data: PricingType[];
  totalPages: number;
  totalRecords: number;
  rowsPerPage: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

// Interface for Created/Updated By User Info
export interface UserInfo {
  id: string;
  full_name: string;
}

// Interface for a single Pricing Type Detail
export interface PricingTypeDetail {
  pricing_type_id: string;
  pricing_type_name: string;
  pricing_type_description: string;
  status: string;
  status_date: string;
  created_at: string;
  updated_at: string;
  created_by: UserInfo;
  updated_by: UserInfo;
}

// Interface for a single Product Detail
export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  series: string;
  barcode: string;
  category: string;
  market_region: string;
}

// Interface for a single Location Detail
export interface LocationDetail {
  id: string;
  name: string;
  type: string;
}

// Interface for a single Pricing Record
export interface PricingRecord {
  pricing_id: string;
  price: string;
  valid_from: string;
  valid_to: string | null;
  status_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: UserInfo;
  updated_by: UserInfo;
  product: ProductDetail;
  location: LocationDetail;
}

// Pagination Interface
export interface PricingTypePagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// Interface for API Response
export interface PricingTypeResponse {
  success: boolean;
  data: {
    pricingTypeDetails: PricingTypeDetail;
    pricingDetails: PricingRecord[];
    pagination: PricingTypePagination;
  };
}

export type PricingTypeTableRow = {
  // Pricing (flattened)
  pricing_id: string;
  price: string;
  
  // Product Details
  product_id: string | null;
  product_name: string;
  product_series: string;
  product_brand: string;
  product_category: string;
  product_barcode: string;
  product_market_region: string;
  
  // Location Details
  location_id: string | null;
  location_name: string;
  location_type: string;
  
  // Created By Details
  created_by_id: string | null;
  created_by_name: string;
  
  // Updated By Details
  updated_by_id: string | null;
  updated_by_name: string;
  
  // Status & Dates
  status: string;
  status_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
  
  // Audit Timestamps
  created_at: string | null;
  updated_at: string | null;
};

// Type for the pricing type dropdown item
export interface PricingTypeDropdownItem {
  id: string; // Unique identifier for the pricing type
  label: string; // Display label for the dropdown (e.g., "Friend and Family Price")
}

// Type for the API response
export type PricingTypeDropdownResponse = PricingTypeDropdownItem[];
