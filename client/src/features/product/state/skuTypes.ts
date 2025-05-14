import type { ApiSuccessResponse, PaginatedResponse } from "types/api";

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

// ==============================
// Sub-types
// ==============================

export interface DimensionInfo {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightG: number;
  lengthInch: number;
  widthInch: number;
  heightInch: number;
  weightLb: number;
}

export interface ProductInfo {
  id: string;
  product_name: string;
  displayName: string;
  brand: string;
  series: string;
  category: string;
}

export interface AuditInfo {
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    fullName: string;
  } | null;
  updatedBy: {
    id: string;
    fullName: string;
  } | null;
}

export type StatusInfo =
  | string
  | {
  sku: string;
  product: string;
};

export interface PricingInfo {
  price: number;
  location: string;
  valid_from: string;
  valid_to: string | null;
  pricing_type: string;
  location_type: string;
}

export interface ComplianceInfo {
  type: string;
  compliance_id: string;
  issued_date: string;
  expiry_date: string | null;
  description: string;
}

export interface ImageInfo {
  type: 'main' | 'zoom' | string;
  order: number;
  image_url: string;
  alt_text: string;
  is_primary: boolean;
}

// ==============================
// Main type
// ==============================

export interface SkuDetails {
  skuId: string;
  sku: string;
  barcode: string;
  language: string;
  countryCode: string;
  marketRegion: string;
  sizeLabel: string;
  description: string;
  dimensions: DimensionInfo;
  status: StatusInfo;
  statusDate: string;
  product: ProductInfo;
  audit: AuditInfo;
  prices: PricingInfo[];
  compliances: ComplianceInfo[];
  images: ImageInfo[];
}

export type SkuDetailResponse = ApiSuccessResponse<SkuDetails>;
