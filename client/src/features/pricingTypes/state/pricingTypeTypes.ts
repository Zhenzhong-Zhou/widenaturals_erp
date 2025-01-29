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

// Pricing Type Interfaces
export interface PricingTypeDetails {
  pricing_type_id: string;
  pricing_type_name: string;
  pricing_type_description: string;
  pricing_type_created_at: string;
  pricing_type_updated_at: string;
  pricing_id: string;
  price: string;
  valid_from: string;
  valid_to: string | null;
  status_date: string;
  product_id: string;
  product_name: string;
  series: string;
  brand: string;
  category: string;
  barcode: string;
  market_region: string;
  location_id: string;
  location_name: string;
  location_type_name: string;
  pricing_status_name: string;
}

export interface PricingTypePagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

export interface PricingTypeResponse {
  success: boolean;
  data: {
    data: PricingTypeDetails[];
    pagination: PricingTypePagination;
  };
}
