import type {
  ApiSuccessResponse,
  AsyncState,
  GenericAudit,
  GenericStatus
} from '@shared-types/api';

/** Root response for GET /sku/:id */
export type GetSkuDetailResponse = ApiSuccessResponse<SkuDetail>;

/** Main SKU detail container */
export interface SkuDetail {
  id: string;
  sku: string;
  barcode: string;
  description: string;
  language: string;
  sizeLabel: string;
  countryCode: string;
  marketRegion: string;
  
  product: SkuProduct;
  dimensions: SkuDimensions;
  status: GenericStatus;
  audit: GenericAudit;
  
  images: SkuImage[];
  pricing: SkuPricing[];
  complianceRecords: SkuComplianceRecord[];
}

/* ---------------------------
 * PRODUCT
 * --------------------------- */
export interface SkuProduct {
  id: string;
  name: string;
  series: string;
  brand: string;
  category: string;
  displayName: string;
}

/* ---------------------------
 * DIMENSIONS
 * --------------------------- */
export interface SkuDimensions {
  cm: {
    length: string;
    width: string;
    height: string;
  };
  inches: {
    length: string;
    width: string;
    height: string;
  };
  weight: {
    g: string;
    lb: string;
  };
}

/* ---------------------------
 * IMAGES (USES GENERIC AUDIT)
 * --------------------------- */
export interface SkuImage {
  id: string;
  imageUrl: string;
  type: "main" | "thumbnail" | "zoom";
  isPrimary: boolean;
  altText: string;
  
  metadata: {
    sizeKb: number;
    format: string;
    displayOrder: number;
  };
  
  audit: GenericAudit<{
    uploadedAt: string;
  }>;
}

/* ---------------------------
 * PRICING (USES GENERIC AUDIT)
 * --------------------------- */
export interface SkuPricing {
  id: string;
  skuId: string;
  
  priceType: string;
  
  location: {
    name: string;
    type: string;
  };
  
  price: string;
  validFrom: string;
  validTo: string | null;
  
  status: {
    id: string;
    date: string;
  };
  
  // Pricing has no extra audit fields → use GenericAudit directly
  audit: GenericAudit;
}

/* ---------------------------
 * COMPLIANCE (USES GENERIC AUDIT)
 * --------------------------- */
export interface SkuComplianceRecord {
  type: string;
  complianceId: string;
  issuedDate: string;
  expiryDate: string | null;
  
  metadata: {
    status: {
      id: string;
      name: string;
      date: string;
    };
    description: string;
  };
  
  // Compliance has no extra special fields → GenericAudit
  audit: GenericAudit;
}

/**
 * Redux state slice for storing detailed SKU information.
 *
 * This uses the generic `AsyncState<T>` pattern, where:
 * - `data` holds the fetched `SkuDetail` object (or null if not yet loaded)
 * - `loading` indicates whether a fetch request is currently in progress
 * - `error` contains an error message (if any) from a failed fetch
 *
 * Used together with `getSkuDetailByIdThunk` to manage the full
 * lifecycle of fetching a single SKU’s details.
 */
export type SkuDetailState = AsyncState<SkuDetail | null>;
