// Define the Pricing Record structure
export interface Pricing {
  pricing_id: string;
  product_name: string;
  price_type_name: string;
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

export interface Product {
  product_id: string;
  name: string;
  brand: string;
  barcode: string;
  category: string;
  market_region: string;
}

export interface LocationType {
  type_id: string;
  type_name: string;
}

export interface PricingLocation {
  location_id: string;
  location_name: string;
  location_type: LocationType;
}

/**
 * Extended interface for detailed pricing records.
 * Now supports multiple products & locations.
 */
export interface PricingDetails extends Pricing {
  products: Product[]; // Changed from single object to array
  locations: PricingLocation[]; // Changed from single object to array
}

export interface PricingDetailsResponse {
  success: boolean;
  message: string;
  data: {
    pricing: PricingDetails;
    pagination: Pagination;
  };
}

// Interface for the request parameters
export interface PriceRequestParams {
  productId: string;
  priceTypeId: string;
}

// Type for the API response
export type PriceResponse = {
  price: string;         // Using string to maintain the format "180.00"
  productId: string;
  priceTypeId: string;
};

export interface PriceState {
  priceData: PriceResponse | null;
  loading: boolean;
  error: string | null;
}
