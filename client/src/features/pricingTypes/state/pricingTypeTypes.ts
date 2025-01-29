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