import type { PaginatedResponse, Pagination } from 'types/api';

// Define the Pricing Record structure
export interface PricingRecord {
  pricingId: string;
  price: number;
  validFrom: string; // ISO date string
  validTo: string | null;
  pricingType: {
    name: string;
    code: string;
  };
  sku: {
    id: string;
    value: string;
    countryCode: string;
    sizeLabel: string;
    barcode: string;
  };
  product: {
    id: string;
    name: string;
    brand: string;
  };
}

export interface FetchPricingParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, string>;
  keyword?: string;
}

// Define the API Response structure
export type PaginatedPricingRecordsResponse = PaginatedResponse<PricingRecord>;

export interface PricingListState {
  data: PricingRecord[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
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





// Interface for the request parameters
export interface PriceRequestParams {
  productId: string;
  priceTypeId: string;
}

// Type for the API response
export type PriceResponse = {
  price: string; // Using string to maintain the format "180.00"
  productId: string;
  priceTypeId: string;
};

export interface PriceState {
  priceData: PriceResponse | null;
  loading: boolean;
  error: string | null;
}
