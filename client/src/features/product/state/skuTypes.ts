export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

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

export interface PaginatedSkuProductCardResponse {
  success: boolean;
  message: string;
  data: SkuProductCard[];
  pagination: Pagination;
}

export interface SkuProductCardFilters {
  brand?: string;
  category?: string;
  marketRegion?: string;
  sizeLabel?: string;
  keyword?: string;
}
