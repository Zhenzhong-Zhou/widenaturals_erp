import type { PaginatedResponse } from '@shared-types/api';

export interface SkuProductCard {
  skuId: string;
  skuCode: string;
  barcode: string;
  displayName: string;
  brand: string;
  series: string;
  status: string;
  npnComplianceId: string | null;
  msrpPrice: number | null;
  imageUrl: string | null;
  imageAltText: string;
}

export type PaginatedSkuProductCardResponse = PaginatedResponse<SkuProductCard>;

export interface SkuProductCardFilters {
  brand?: string;
  category?: string;
  marketRegion?: string;
  sizeLabel?: string;
  keyword?: string;
}

export interface PricingInfo {
  price: number;
  location: string;
  valid_from: string;
  valid_to: string | null;
  pricing_type: string;
  location_type: string;
}

export interface ImageInfo {
  type: 'main' | 'zoom' | string;
  order: number;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}
