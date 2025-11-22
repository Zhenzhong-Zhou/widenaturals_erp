import type {
  ApiSuccessResponse,
  AsyncState,
  AuditUser,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

/**
 * Root API response for fetching paginated SKU product cards.
 * Includes pagination metadata and an array of compact SKU card entries.
 */
export type GetSkuProductCardsResponse = PaginatedResponse<SkuProductCard>;

/**
 * A single SKU product-card entry used for catalog listing.
 * Contains only the fields required for grid/list display (not full SKU detail).
 */
export interface SkuProductCard {
  /** Unique SKU identifier */
  skuId: string;
  
  /** Formatted SKU code (e.g., "WN-MO409-L-UN") */
  skuCode: string;
  
  /** Product barcode (UPC/EAN) */
  barcode: string;
  
  /** Human-readable product name (e.g., "Algal Oil Pure + DHA – Kids") */
  displayName: string;
  
  /** Brand name (e.g., "WIDE Naturals") */
  brand: string;
  
  /** Series / product line (e.g., "WIDE Collection") */
  series: string;
  
  /** Product category (e.g., "Marine Oil") */
  category: string;
  
  /**
   * Unified product/SKU status.
   * - `null`: no status available
   * - `"active"` | `"inactive"`: backend flattened because both sides matched
   * - `{ product, sku }`: mixed state when product-level and SKU-level differ
   */
  status: SkuProductStatus;
  
  /** Compliance info such as NPN or FDA identifiers; `null` if not applicable */
  compliance: SkuCompliance | null;
  
  /** Pricing information (currently only MSRP, but extendable for other price types) */
  price: SkuCardPrice | null;
  
  /** Primary display image for the product card */
  image: {
    /** Relative or absolute URL to the image; `null` when not available */
    url: string | null;
    
    /** Alternative text for accessibility; may be `null` */
    alt: string | null;
  };
}

/**
 * Unified product + SKU status shape returned by backend.
 *
 * Backend behavior:
 * - When both product and SKU have the same status → returns `"active"` or `"inactive"`
 * - When product and SKU differ → returns `{ product: string|null, sku: string|null }`
 * - When status missing → returns `null`
 */
export type SkuProductStatus =
  | null
  | string
  | {
  product: string | null;
  sku: string | null;
};

/** Compliance metadata (e.g., Canadian NPN number or FDA code) */
export interface SkuCompliance {
  /** Compliance type (e.g., "NPN", "FDA", "CE") */
  type: string;
  
  /** Compliance identifier or registration number */
  number: string;
}

/**
 * Price block for SKU product cards.
 * Currently, supports MSRP, but intentionally structured for extensibility.
 */
export interface SkuCardPrice {
  /** MSRP for display purposes; may be null if pricing is not available */
  msrp: number | null;
}

/**
 * Filters used to query and paginate the list of SKU product cards.
 *
 * This interface supports both:
 * - User-provided filters (search UI, dropdown selectors, advanced filters).
 * - System-applied filters (e.g., access-control enforced visibility rules).
 *
 * Fields like `productStatusId` or `skuStatusId` may be injected dynamically
 * during ACL evaluation (e.g., `applySkuProductCardVisibilityRules`).
 */
export interface SkuProductCardFilters {
  /**
   * Free-text keyword for multi-field fuzzy search:
   * name, brand, category, SKU code, compliance ID.
   */
  keyword?: string;
  
  /**
   * Product-level filters
   */
  productName?: string;
  brand?: string;
  category?: string;
  
  /**
   * SKU-level filters
   */
  sku?: string;
  skuIds?: string[];
  sizeLabel?: string;
  marketRegion?: string;
  countryCode?: string;
  
  /**
   * Status constraints:
   * - `productStatusId` → product table status
   * - `skuStatusId` → sku table status
   * These may be overridden by ACL logic.
   */
  productStatusId?: string;
  skuStatusId?: string;
  
  /**
   * Compliance filters (e.g., NPN / document numbers)
   */
  complianceId?: string;
}

/**
 * Query parameters used to fetch a paginated, sorted, and filtered list
 * of SKU product-card entries.
 *
 * Includes:
 * - Pagination fields:
 *    - `page`: current page number (1-based)
 *    - `limit`: number of results per page
 * - Sorting:
 *    - `sortBy`: logical or DB field name resolved through the sort map
 *    - `sortOrder`: 'ASC' | 'DESC'
 * - Filters (`filters`):
 *    - Product fields: name, brand, category
 *    - SKU fields: sku code, barcode, size, region
 *    - Compliance: document ID/NPN
 *    - ACL-injected status constraints
 */
export interface SkuProductCardQueryParams
  extends PaginationParams,
    SortConfig {
  filters?: SkuProductCardFilters;
}

/**
 * Allowed fields for sorting the SKU product card list.
 * These must align with entries in the skuProductCards sort map.
 */
export type SkuProductCardSortField =
  | 'brand'
  | 'category'
  | 'marketRegion'
  | 'sizeLabel'
  | 'defaultNaturalSort';

/**
 * Redux-managed state slice for paginated SKU product cards.
 *
 * This type specializes the generic `ReduxPaginatedState<T>` for
 * `SkuProductCard` items returned from the SKU Product Cards API.
 *
 * Includes:
 *  - `data`:      array of SKU product-card entries
 *  - `pagination`: pagination metadata (page, limit, totalRecords, totalPages)
 *  - `loading`:   whether data is currently being fetched
 *  - `error`:     optional error message from failed requests
 *
 * NOTE:
 * If you need to persist query params (filters, sorting, etc.),
 * extend this type to include `params: SkuProductCardQueryParams`.
 */
export type SkuProductCardsState = ReduxPaginatedState<SkuProductCard>;

/**
 * Flattened SKU Product Card used by the frontend UI.
 *
 * This type is produced after transforming the raw backend `SkuProductCard`
 * response into a simplified, display-ready structure for catalog cards.
 *
 * It removes nested objects (status, compliance, image, price) and exposes
 * only the fields needed by the product catalog grid.
 */
export interface SkuProductCardViewItem {
  /** Unique SKU identifier */
  skuId: string;
  
  /** Formatted SKU code (e.g., "WN-MO409-L-UN") */
  skuCode: string;
  
  /** Display name for catalog UI (may differ from full product name) */
  displayName: string;
  
  /** Brand name (e.g., "WIDE Naturals") */
  brand: string;
  
  /** Series or collection the SKU belongs to */
  series: string;
  
  /** Product category (e.g., "Marine Oil") */
  category: string;
  
  /** Product barcode (UPC/EAN); may be null when unavailable */
  barcode: string | null;
  
  /** Compliance type (e.g., NPN, FDA); null if no compliance is recorded */
  complianceType: string | null;
  
  /** Compliance registration number; null when compliance does not apply */
  complianceNumber: string | null;
  
  /**
   * Unified product/SKU status string.
   * Example: "active" or "inactive".
   *
   * Present only if product-level and SKU-level statuses are identical.
   * Otherwise, the UI uses productStatus and skuStatus instead.
   */
  unifiedStatus: string | null;
  
  /** Product-level status when different from SKU-level; null otherwise */
  productStatus: string | null;
  
  /** SKU-level status when different from product-level; null otherwise */
  skuStatus: string | null;
  
  /** MSRP value used for catalog display; null when not available */
  msrp: number | null;
  
  /** Absolute or relative URL to the primary display image; null if absent */
  imageUrl: string | null;
  
  /** Alternative text for product image, guaranteed to be a string */
  imageAlt: string;
}

/**
 * Root API response for `GET /sku/:id`.
 *
 * Wraps the SKU detail payload inside a standardized ApiSuccessResponse.
 */
export type GetSkuDetailResponse = ApiSuccessResponse<SkuDetail>;

/**
 * Full detail structure for a single SKU.
 *
 * Includes product metadata, dimensions, pricing, compliance data,
 * image metadata, and full audit information.
 */
export interface SkuDetail {
  /** SKU UUID */
  id: string;
  
  /** Human-readable SKU code (e.g., "CH-HN100-R-CN") */
  sku: string;
  
  /** Barcode / GTIN for retail scanning */
  barcode: string;
  
  /** Product description (language-specific) */
  description: string;
  
  /** Language code (e.g., "EN", "FR", "ZH") */
  language: string;
  
  /** Variant size label (e.g., "60 Capsules", "120 Softgels") */
  sizeLabel: string;
  
  /** Country code associated with this SKU */
  countryCode: string;
  
  /** Market region (e.g., "CA", "US", "INT") */
  marketRegion: string;
  
  /** Parent product metadata */
  product: SkuProduct;
  
  /** Packaging dimensions and weight (metric + imperial) */
  dimensions: SkuDimensions;
  
  /** Current status (active, inactive, archived, etc.) */
  status: GenericStatus;
  
  /** Audit trail (created/updated timestamps & users) */
  audit: GenericAudit;
  
  /** List of images bound to this SKU */
  images: SkuImage[];
  
  /** Pricing entries for all regions and types */
  pricing: SkuPricing[];
  
  /** Compliance certifications and regulatory metadata */
  complianceRecords: SkuComplianceRecord[];
}

/* -------------------------------------------------------------------------- */
/* PRODUCT                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Product metadata attached to the SKU.
 *
 * Note: A product can have multiple SKUs (variants by region, size, language).
 */
export interface SkuProduct {
  /** Product UUID */
  id: string;
  
  /** Core product name (region-agnostic) */
  name: string;
  
  /** Product series (e.g., "Canaherb Health Series") */
  series: string;
  
  /** Brand name (e.g., "Canaherb") */
  brand: string;
  
  /** Category (e.g., "Supplements", "Vitamins") */
  category: string;
  
  /** Display name composed for UI (product + size + region) */
  displayName: string;
}

/* -------------------------------------------------------------------------- */
/* DIMENSIONS                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Dimensions and weight for a SKU. Includes both metric and imperial units.
 */
export interface SkuDimensions {
  cm: {
    /** Length in centimeters */
    length: string;
    
    /** Width in centimeters */
    width: string;
    
    /** Height in centimeters */
    height: string;
  };
  
  inches: {
    /** Length in inches */
    length: string;
    
    /** Width in inches */
    width: string;
    
    /** Height in inches */
    height: string;
  };
  
  weight: {
    /** Weight in grams */
    g: string;
    
    /** Weight in pounds */
    lb: string;
  };
}

/* -------------------------------------------------------------------------- */
/* IMAGES                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Image metadata attached to a SKU.
 *
 * Note: This uses a custom audit block because images have their own
 * `uploadedAt` + `uploadedBy`, not the standard created/updated fields.
 */
export interface SkuImage {
  /** Image UUID */
  id: string;
  
  /** Fully resolved image URL (S3 or CDN) */
  imageUrl: string;
  
  /** Image type: main | thumbnail | zoom */
  type: "main" | "thumbnail" | "zoom";
  
  /** Indicates the primary image for presentation */
  isPrimary: boolean;
  
  /** Optional alt text for accessibility */
  altText: string;
  
  /** Additional derived metadata such as size and order */
  metadata: {
    /** File size in KB */
    sizeKb: number;
    
    /** MIME format (e.g., "image/jpeg") */
    format: string;
    
    /** Display order (for sorting in gallery) */
    displayOrder: number;
  };
  
  /** Image-specific audit fields */
  audit: {
    /** Timestamp when uploaded */
    uploadedAt: string | null;
    
    /** User who uploaded the image */
    uploadedBy: AuditUser | null;
  };
}

/* -------------------------------------------------------------------------- */
/* PRICING                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Pricing information for a SKU.
 *
 * Uses GenericAudit because it only requires created/updated timestamps
 * and users — no image-style custom audit fields.
 */
export interface SkuPricing {
  /** Pricing UUID */
  id: string;
  
  /** SKU UUID */
  skuId: string;
  
  /** Pricing type (MSRP, Retail, Wholesale, etc.) */
  priceType: string;
  
  /** Location where the pricing applies */
  location: {
    name: string;
    type: string;
  };
  
  /** Price value (stored as string for precision consistency) */
  price: string;
  
  /** When the pricing becomes effective */
  validFrom: string;
  
  /** When the pricing expires (null = active) */
  validTo: string | null;
  
  /** Pricing status (active, archived, scheduled, etc.) */
  status: {
    id: string;
    date: string;
  };
  
  /** Standard audit: createdAt, createdBy, updatedAt, updatedBy */
  audit: GenericAudit;
}

/* -------------------------------------------------------------------------- */
/* COMPLIANCE                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Compliance record attached to a SKU (e.g., NPN, FDA, GMP, CE).
 *
 * Uses GenericAudit because it's a normal table with standard auditing.
 */
export interface SkuComplianceRecord {
  /** Compliance record UUID */
  id: string;
  
  /** Type (e.g., "NPN", "FDA", "GMP") */
  type: string;
  
  /** Underlying compliance ID (links to compliance_records table) */
  complianceId: string;
  
  /** Issue date for the certification */
  issuedDate: string;
  
  /** Expiry date (null = permanent / non-expiring) */
  expiryDate: string | null;
  
  /** Extra metadata (status, description, etc.) */
  metadata: {
    status: {
      /** Status ID */
      id: string;
      
      /** Status name (Active, Expired, Pending) */
      name: string;
      
      /** Date status was applied */
      date: string;
    };
    
    /** Freeform description / notes */
    description: string;
  };
  
  /** Standard audit fields for created/updated tracking */
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

/**
 * Flattened metadata structure for a single SKU image.
 *
 * This is used for table exports, CSV generation, and UI display where
 * nested audit/metadata fields must be normalized into a simple structure.
 */
export interface FlattenedImageMetadata {
  /** Image type (main, thumbnail, zoom) */
  type: string | null;
  
  /** "Yes" / "No" value for primary image flag */
  isPrimary: string | null;
  
  /** Display ordering for the image gallery */
  displayOrder: number | null;
  
  /** File size in KB */
  sizeKb: number | null;
  
  /** File format (e.g., "jpeg", "png") */
  format: string | null;
  
  /** Timestamp when uploaded */
  uploadedAt: string | null;
  
  /** User full name who uploaded the image */
  uploadedBy: string | null;
}

/**
 * Formatter map used by exporters and table utilities.
 * Allows defining key → formatter function mapping to process values.
 */
export interface FormatterMap {
  [key: string]: (value: any) => string;
}

/**
 * Flattened SKU core information.
 *
 * Represents the main SKU profile with product dimensions, status,
 * audit fields, and descriptive metadata. Used for list views,
 * export files, and report generation.
 */
export interface FlattenedSkuInfo {
  /** SKU UUID */
  id: string;
  
  /** SKU code (e.g., "CH-HN100-R-CN") */
  sku: string;
  
  /** Product barcode / GTIN */
  barcode: string;
  
  /** Product description */
  description: string;
  
  /** Language code for SKU (e.g., "EN") */
  language: string;
  
  /** Size label (e.g., "60 Capsules") */
  sizeLabel: string;
  
  /** Country identifier */
  countryCode: string;
  
  /** Market region */
  marketRegion: string;
  
  /** Dimensions (cm) */
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  
  /** Dimensions (inch) */
  lengthInch: string;
  widthInch: string;
  heightInch: string;
  
  /** Weight (metric + imperial) */
  weightG: string;
  weightLb: string;
  
  /** Human-readable status name */
  statusName: string;
  
  /** Timestamp when status was applied */
  statusDate: string;
  
  /** Standard audit info */
  createdAt: string;
  createdBy: string;
  
  /** Updated metadata (nullable for never-updated entries) */
  updatedAt: string | null;
  updatedBy: string | null;
}

/**
 * Flattened compliance record for a SKU.
 *
 * Includes regulatory compliance metadata (NPN, FDA, GMP, etc.),
 * status info, description, and audit timestamps.
 */
export interface FlattenedComplianceRecord {
  /** Compliance record UUID */
  id: string;
  
  /** Compliance type (e.g., "NPN", "FDA") */
  type: string;
  
  /** Underlying compliance definition ID */
  complianceId: string;
  
  /** Date issued */
  issuedDate: string | null;
  
  /** Expiry date (nullable if non-expiring) */
  expiryDate: string | null;
  
  /** Description or certification notes */
  description: string;
  
  /** Human-readable status name */
  status: string;
  
  /** Timestamp of status change */
  statusDate: string | null;
  
  /** Audit fields */
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

/**
 * Flattened pricing entry for a SKU.
 *
 * Represents normalized pricing data across price types,
 * regions, and validity periods with linked audit fields.
 */
export interface FlattenedPricingRecord {
  /** Pricing UUID */
  id: string;
  
  /** Linked SKU UUID */
  skuId: string;
  
  /** Pricing type (MSRP, Retail, Wholesale, etc.) */
  priceType: string;
  
  /** Optional location info */
  locationName: string | null;
  locationType: string | null;
  
  /** Price value */
  price: string;
  
  /** Pricing status (e.g., "active", "expired") */
  status: string | null;
  
  /** When the pricing status was applied */
  statusDate: string | null;
  
  /** Pricing effective period */
  validFrom: string | null;
  validTo: string | null;
  
  /** Audit fields */
  createdBy: string | null;
  createdAt: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}
