import type { PaginatedResponse, ReduxPaginatedState } from '@shared-types/api';

// Define the Pricing Record structure
export interface PricingRecord {
  pricingId: string;
  price: number;
  validFrom: string; // ISO date string
  validTo: string | null;
  pricingType: {
    id: string;
    name: string;
    code: string;
    slug: string;
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

/**
 * Redux state structure for managing a paginated list of pricing records.
 */
export type PricingListState = ReduxPaginatedState<PricingRecord>;

export interface Product {
  product_id: string;
  name: string;
  brand: string;
  barcode: string;
  category: string;
  market_region: string;
}

export interface PricingType {
  name: string;
}

export interface Pricing {
  locationId: string;
  locationName: string;
  price: string; // If this should be a number, change to: number
  validFrom: string; // ISO date string
  validTo: string | null;
  status: {
    id: string;
    name: string;
  };
  createdAt: string;
  createdBy: {
    fullname: string;
  };
  updatedAt: string | null;
  updatedBy: {
    fullname: string;
  };
}

export interface SKU {
  sku: string;
  barcode: string;
  countryCode: string;
  sizeLabel: string;
}

export interface Product {
  productName: string;
  brand: string;
}

export interface PricingDetail {
  pricingType: PricingType;
  pricing: Pricing;
  sku: SKU;
  product: Product;
  productCount: number;
}

export type PaginatedPricingDetailsResponse = PaginatedResponse<PricingDetail>;

export type PricingState = ReduxPaginatedState<PricingDetail>;