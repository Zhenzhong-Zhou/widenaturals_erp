import type {
  ApiSuccessResponse,
  PaginatedResponse,
} from '@shared-types/api';
import type {
  Pagination
} from '@shared-types/pagination';

export interface FetchPricingTypesParams {
  page?: number;
  limit?: number;
  name?: string; // Search keyword for name/code
  startDate?: string; // ISO format date string
  endDate?: string; // ISO format date string
}

// Interface for a single PricingType
export interface PricingType {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  status: string;
  statusDate: string;
  createdAt: string;
  updatedAt: string | null;
  createdByFullName: string;
  updatedByFullName: string | null;
}

// Interface for the response structure
export type PricingTypesResponse = PaginatedResponse<PricingType>;

export interface PricingTypesState {
  data: PricingType[];
  pagination: Pagination;
  isLoading: boolean;
  error: string | null;
}

export interface PricingTypeTableProps {
  data: PricingType[];
  page: number; // zero-based for MUI
  rowsPerPage: number;
  totalRecords: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newLimit: number) => void;
}

// Interface for Created/Updated By User Info
export interface UserInfo {
  id: string;
  full_name: string;
}

// Interface for a single Pricing Type Detail
export interface PricingTypeMetadata {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  status: {
    id: string;
    name: string;
    statusDate: string; // ISO date string
  };
  createdBy: {
    id: string;
    fullName: string;
  };
  updatedBy: {
    id: string | null;
    fullName: string;
  };
  createdAt: string; // ISO date string
  updatedAt: string | null;
}

// Interface for API Response
export type PricingTypeMetadataResponse =
  ApiSuccessResponse<PricingTypeMetadata>;

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
