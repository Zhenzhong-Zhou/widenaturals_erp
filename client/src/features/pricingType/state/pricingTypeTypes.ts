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

// Type for the pricing type dropdown item
export interface PricingTypeDropdownItem {
  id: string;     // Unique identifier for the pricing type
  label: string;  // Display label for the dropdown (e.g., "Friend and Family Price")
}

// Type for the API response
export type PricingTypeDropdownResponse = PricingTypeDropdownItem[];