// Define the Pricing Record structure
export interface Pricing {
  pricing_id: string;
  product_name: string;
  price_type: 'Product Cost' | 'Retail' | 'MSRP'; // Enum-like strict types
  location_name: string;
  price: string;
  valid_from: string; // ISO Timestamp
  valid_to: string; // ISO Timestamp
  status_name: 'active' | 'inactive' | 'pending'; // Expand based on actual statuses
  status_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

// Define the Pagination Metadata structure
export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

// Define the API Response structure
export interface PricingResponse {
  success: boolean;
  message: string;
  data: {
    data: Pricing[];
    pagination: Pagination;
  };
}
