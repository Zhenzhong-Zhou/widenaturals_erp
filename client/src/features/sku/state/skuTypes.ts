import type {
  ApiSuccessResponse,
  AsyncState,
  AuditUser,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
  UpdateStatusIdRequest,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';
import type { NullableNumber, NullableString } from '@shared-types/shared';

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
    url: NullableString;

    /** Alternative text for accessibility; may be `null` */
    alt: NullableString;
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
      product: NullableString;
      sku: NullableString;
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
  msrp: NullableNumber;
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
  extends PaginationParams, SortConfig {
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
  barcode: NullableString;

  /** Compliance type (e.g., NPN, FDA); null if no compliance is recorded */
  complianceType: NullableString;

  /** Compliance registration number; null when compliance does not apply */
  complianceNumber: NullableString;

  /**
   * Unified product/SKU status string.
   * Example: "active" or "inactive".
   *
   * Present only if product-level and SKU-level statuses are identical.
   * Otherwise, the UI uses productStatus and skuStatus instead.
   */
  unifiedStatus: NullableString;

  /** Product-level status when different from SKU-level; null otherwise */
  productStatus: NullableString;

  /** SKU-level status when different from product-level; null otherwise */
  skuStatus: NullableString;

  /** MSRP value used for catalog display; null when not available */
  msrp: NullableNumber;

  /** Absolute or relative URL to the primary display image; null if absent */
  imageUrl: NullableString;

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
  images: SkuImageGroup[];

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
    length: number;

    /** Width in centimeters */
    width: number;

    /** Height in centimeters */
    height: number;
  };

  inches: {
    /** Length in inches */
    length: number;

    /** Width in inches */
    width: number;

    /** Height in inches */
    height: number;
  };

  weight: {
    /** Weight in grams */
    g: number;

    /** Weight in pounds */
    lb: number;
  };
}

/* -------------------------------------------------------------------------- */
/* IMAGES                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Represents a single image variant inside a group.
 * Example: main, thumbnail, or zoom.
 */
export interface SkuImageVariant {
  /** Image UUID */
  id: string;

  /** Fully resolved image URL (S3 or CDN) */
  imageUrl: string;

  /** Optional alt text for accessibility */
  altText: string;

  /** Optional derived metadata */
  metadata?: {
    /** File size in KB */
    sizeKb?: NullableNumber;

    /** MIME format (e.g., "image/webp") */
    format?: NullableString;

    /** Display order (for sorting inside group) */
    displayOrder?: NullableNumber;
  };
}

/**
 * Logical image group for a SKU.
 *
 * A group may contain multiple variants:
 * - main      → default display image
 * - thumbnail → used in list/grid views
 * - zoom      → high resolution image
 *
 * Groups are ordered by primary priority and display order.
 */
export interface SkuImageGroup {
  /** Logical image group UUID */
  groupId: string;

  /** Whether this group is marked as primary */
  isPrimary: boolean;

  /**
   * Image variants available in this group.
   * Not all variants are guaranteed to exist.
   */
  variants: {
    main?: SkuImageVariant;
    thumbnail?: SkuImageVariant;
    zoom?: SkuImageVariant;
  };

  /** Image-specific audit fields */
  audit?: {
    /** Timestamp when uploaded */
    uploadedAt: NullableString;

    /** User who uploaded the image */
    uploadedBy: AuditUser | null;
  };
}

/* -------------------------------------------------------------------------- */
/* PRICING                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Pricing information assigned to a SKU through a pricing group.
 *
 * One pricing entry — pricing type, country scope, validity period,
 * optional status, and optional audit metadata. `status` and `audit` are
 * omitted from the response when ACL denies the corresponding visibility.
 */
export interface SkuPricing {
  /** Pricing record UUID */
  pricingId: string;
  
  /** SKU UUID */
  skuId: string;
  
  /** Pricing group UUID */
  pricingGroupId: string;
  
  /** Pricing type UUID */
  pricingTypeId: NullableString;
  
  /** Pricing type display name, such as MSRP, Retail, Wholesale, etc. */
  pricingTypeName: NullableString;
  
  /** Pricing type code */
  pricingTypeCode: NullableString;
  
  /** Country/region scope for this price; null or GLOBAL means global pricing */
  countryCode: NullableString;
  
  /** Numeric price value returned from the backend */
  price: number;
  
  /** When the pricing becomes effective */
  validFrom: string;
  
  /** When the pricing expires; null means open-ended */
  validTo: NullableString;
  
  /** Pricing status — absent when the user lacks status visibility */
  status?: GenericStatus;
  
  /** Standard audit metadata — absent when the user lacks audit visibility */
  audit?: GenericAudit;
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
  expiryDate: NullableString;

  /** Extra metadata (status, description, etc.) */
  metadata: {
    status:GenericStatus;

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
 * Flattened metadata structure for a single SKU image variant
 * extracted from a grouped image model.
 *
 * Used for:
 * - Table rendering
 * - CSV exports
 * - Metadata popovers
 *
 * This represents one selected variant (main | thumbnail | zoom)
 * from a SkuImageGroup.
 */
export interface FlattenedImageMetadata {
  /**
   * Variant type selected from group.
   * Example: "main", "thumbnail", "zoom"
   */
  type: 'main' | 'thumbnail' | 'zoom' | null;

  /**
   * "Yes" / "No" value derived from group.isPrimary
   */
  isPrimary: 'Yes' | 'No' | null;

  /**
   * Display order within the image group
   */
  displayOrder: NullableNumber;

  /**
   * File size in KB (variant-level metadata)
   */
  sizeKb: NullableNumber;

  /**
   * File format (e.g., "webp", "jpg")
   */
  format: NullableString;

  /**
   * Timestamp when the image group was uploaded
   */
  uploadedAt: NullableString;

  /**
   * Full name of user who uploaded the image group
   */
  uploadedBy: NullableString;
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
  lengthCm: number;
  widthCm: number;
  heightCm: number;

  /** Dimensions (inch) */
  lengthInch: number;
  widthInch: number;
  heightInch: number;

  /** Weight (metric + imperial) */
  weightG: number;
  weightLb: number;

  /** status UUID */
  statusId: string;

  /** Human-readable status name */
  statusName: string;

  /** Timestamp when status was applied */
  statusDate: string;

  /** Standard audit info */
  createdAt: string;
  createdBy: string;

  /** Updated metadata (nullable for never-updated entries) */
  updatedAt: NullableString;
  updatedBy: NullableString;
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
  issuedDate: NullableString;

  /** Expiry date (nullable if non-expiring) */
  expiryDate: NullableString;

  /** Description or certification notes */
  description: string;

  /** Human-readable status name */
  status: string;

  /** Timestamp of status change */
  statusDate: NullableString;

  /** Audit fields */
  createdAt: string;
  createdBy: string;
  updatedAt: NullableString;
  updatedBy: NullableString;
}

/**
 * Flattened pricing entry for a SKU.
 *
 * Represents pricing-group-based SKU pricing in a table-friendly shape,
 * including pricing type, country scope, validity period, status, and audit fields.
 */
export interface FlattenedPricingRecord {
  /** Pricing record UUID */
  pricingId: string;
  
  /**
   * Row ID alias for table components that expect an `id` field.
   * Usually the same value as pricingId.
   */
  id: string;
  
  /** Linked SKU UUID */
  skuId: string;
  
  /** Linked pricing group UUID */
  pricingGroupId: string;
  
  /** Pricing type UUID */
  pricingTypeId: NullableString;
  
  /** Pricing type display name, such as MSRP, Retail, Wholesale, etc. */
  pricingTypeName: NullableString;
  
  /** Pricing type code */
  pricingTypeCode: NullableString;
  
  /** Country/region scope for this price; null or GLOBAL means global pricing */
  countryCode: NullableString;
  
  /** Numeric price value returned from the backend */
  price: number;
  
  /** Pricing status UUID */
  statusId: NullableString;
  
  /** Pricing status display name */
  statusName: NullableString;
  
  /** When the pricing status was applied */
  statusDate: NullableString;
  
  /** When the pricing becomes effective */
  validFrom: NullableString;
  
  /** When the pricing expires; null means open-ended */
  validTo: NullableString;
  
  /** Audit fields */
  createdBy: NullableString;
  createdAt: NullableString;
  updatedBy: NullableString;
  updatedAt: NullableString;
}

/**
 * Response type for the paginated SKU list API.
 * Wraps a list of SKU items inside a standard `PaginatedResponse<T>` envelope.
 */
export type GetSkuListApiResponse = PaginatedResponse<SkuListItem>;

/**
 * Represents a single SKU row in the paginated SKU list response.
 * Includes SKU details, product relationship, status info, audit metadata,
 * and the primary/best image for thumbnail display.
 */
export interface SkuListItem {
  /** Unique identifier for the SKU */
  id: string;

  /** Foreign key reference to the parent product */
  productId: string;

  /** SKU code */
  sku: string;

  /** Barcode associated with the SKU */
  barcode: string;

  /** Language code (e.g., "en-fr") */
  language: string;

  /** Country code (e.g., "CA", "US", "UN") */
  countryCode: string;

  /** Market region (e.g., "Universe", "Canada", etc.) */
  marketRegion: string;

  /** Size label (e.g., "60 Softgels", "120 Capsules") */
  sizeLabel: string;

  /** Friendly label for frontend display */
  displayLabel: string;

  /**
   * Primary or "best" image URL (from LATERAL join).
   * Null when the SKU has no images.
   */
  primaryImageUrl: NullableString;

  /** Related product information */
  product: SkuListProduct;

  /** Current SKU status and timestamp */
  status: SkuStatusRecord;

  /** Standardized audit metadata (createdBy, updatedBy, timestamps) */
  audit: GenericAudit;
}

/**
 * Minimal product metadata attached to an SKU in the list view.
 */
export interface SkuListProduct {
  id: string;
  name: string;
  series: string;
  brand: string;
  category: string;
  displayName: string;
}

/**
 * Represents the status of an SKU at a point in time.
 */
export interface SkuStatusRecord {
  /** Status ID (e.g., active, inactive, draft) */
  id: string;

  /** Human-readable status name */
  name: string;

  /** ISO 8601 timestamp when the SKU entered this status */
  date: string;
}

/**
 * Filter options for querying the paginated SKU list.
 * Includes product-level, SKU-level, dimensional, audit, and keyword filters.
 */
export interface SkuListFilters {
  // ------------------------------
  // PRODUCT-LEVEL FILTERS
  // ------------------------------
  productName?: NullableString;
  brand?: NullableString;
  category?: NullableString;

  // ------------------------------
  // SKU-LEVEL FILTERS
  // ------------------------------
  sku?: NullableString;
  skuIds?: string[] | NullableString;
  sizeLabel?: NullableString;
  countryCode?: NullableString;
  marketRegion?: NullableString;

  /** Filter by one or more SKU status IDs */
  statusIds?: string[] | null;

  /** Filter by one or more parent product IDs */
  productIds?: string[] | null;

  /** Filter by single SKU status ID */
  skuStatusId?: NullableString;

  /** Filter by product status ID */
  productStatusId?: NullableString;

  // ------------------------------
  // COMPLIANCE FILTERS
  // ------------------------------
  /** Filter by compliance ID linked to the SKU */
  complianceId?: NullableString;

  // ------------------------------
  // DIMENSIONAL FILTERS
  // ------------------------------
  minLengthCm?: NullableNumber;
  maxLengthCm?: NullableNumber;
  minLengthIn?: NullableNumber;
  maxLengthIn?: NullableNumber;

  minWidthCm?: NullableNumber;
  maxWidthCm?: NullableNumber;
  minWidthIn?: NullableNumber;
  maxWidthIn?: NullableNumber;

  minHeightCm?: NullableNumber;
  maxHeightCm?: NullableNumber;
  minHeightIn?: NullableNumber;
  maxHeightIn?: NullableNumber;

  minWeightG?: NullableNumber;
  maxWeightG?: NullableNumber;
  minWeightLb?: NullableNumber;
  maxWeightLb?: NullableNumber;

  // ------------------------------
  // AUDIT FILTERS
  // ------------------------------
  createdBy?: NullableString;
  updatedBy?: NullableString;
  createdAfter?: string | Date | null;
  createdBefore?: string | Date | null;
  updatedAfter?: string | Date | null;
  updatedBefore?: string | Date | null;

  // ------------------------------
  // KEYWORD SEARCH
  // ------------------------------
  /** Matches across SKU code, product name, brand, category (ILIKE fuzzy match) */
  keyword?: NullableString;
}

/**
 * Allowed sort-by field names for the paginated SKU list.
 * These map directly to SQL sort expressions in the backend.
 */
export type SkuSortField =
  // ---- SKU-level fields ----
  | 'skuCode'
  | 'barcode'
  | 'language'
  | 'countryCode'
  | 'marketRegion'
  | 'sizeLabel'

  // ---- Product-level fields ----
  | 'productName'
  | 'productSeries'
  | 'brand'
  | 'category'

  // ---- Status fields ----
  | 'statusName'
  | 'statusDate'

  // ---- Audit fields ----
  | 'createdAt'
  | 'updatedAt'

  // ---- Default fallback ----
  | 'defaultNaturalSort';

/**
 * Query parameters for fetching paginated SKUs.
 * Combines pagination, sorting, and filter options.
 */
export interface FetchSkusParams extends PaginationParams, SortConfig {
  /** Optional structured filter object */
  filters?: SkuListFilters;
}

/**
 * Redux state type for storing a paginated SKU list.
 * Extends a generic paginated Redux structure with SKU item payloads.
 */
export type SkuListState = ReduxPaginatedState<FlattenedSkuRecord>;

/**
 * A flattened, table-ready representation of a SKU list record.
 *
 * This structure is produced by `flattenSkuRecords()` and merges
 * product metadata, SKU attributes, status information, audit
 * fields, and the primary (best) image into a single row suitable for:
 *   - Paginated SKU tables
 *   - Export (CSV / Excel)
 *   - Expandable row views
 *   - Sorting and filtering UI
 *
 * All nested fields from the API are normalized into safe primitives
 * with frontend-friendly fallbacks ("—", empty string, or null).
 */
export interface FlattenedSkuRecord {
  // --------------------------
  // Product Metadata
  // --------------------------

  /** Unique identifier of the parent product; may be null if product is missing. */
  productId: NullableString;

  /** Human-friendly product name from the Product table. */
  productName: string;

  /** Brand name for categorization and display (e.g., "WIDE Naturals"). */
  brand: string;

  /** Product series such as “WIDE Collection”, “Marine Oil”, etc. */
  series: string;

  /** Product category (e.g., "Marine Oil", "Vitamins", etc.). */
  category: string;

  /**
   * Preformatted display name combining product + variant info,
   * suitable for table output.
   */
  displayProductName: string;

  // --------------------------
  // SKU Metadata
  // --------------------------

  /** SKU unique identifier. */
  skuId: NullableString;

  /** SKU code (e.g., "WN-MO411-L-UN"). */
  skuCode: string;

  /** Barcode associated with this SKU. */
  barcode: string;

  /** Language code such as "en-fr". */
  language: string;

  /** Country code for this SKU (e.g., "CA", "US", "UN"). */
  countryCode: string;

  /** Market region label (e.g., "Universe", "Canada"). */
  marketRegion: string;

  /** Packaging or count size, such as “60 Softgels”. */
  sizeLabel: string;

  /**
   * Formatted SKU label for UI display, often includes product title
   * plus variant attributes (e.g., size, language).
   */
  displayLabel: string;

  /**
   * Primary or "best" image for this SKU.
   * Null when no image exists.
   */
  primaryImageUrl: NullableString;

  // --------------------------
  // Status
  // --------------------------

  /** Current SKU status (e.g., "active", "inactive"). */
  statusName: string;

  /** ISO timestamp of the latest status change. */
  statusDate: string;

  // --------------------------
  // Audit Metadata
  // --------------------------

  /** ISO timestamp when the SKU was created. */
  createdAt: string;

  /** Display name of the user/system who created the SKU. */
  createdBy: string;

  /** ISO timestamp when the SKU was last updated. */
  updatedAt: string;

  /** Display name of the user/system who last updated the SKU. */
  updatedBy: string;
}

/**
 * Paginated UI response for SKU list views.
 *
 * Represents a UI-ready paginated payload where each item
 * is a flattened SKU record.
 */
export type GetSkuListUiResponse = PaginatedResponse<FlattenedSkuRecord>;

/**
 * Input payload for creating a single SKU.
 * Mirrors the backend Joi validator: createSkuSchema
 */
export interface CreateSkuInput {
  /** Product foreign key (required, UUID). */
  product_id: string;

  /** Brand code segment of SKU (e.g., WN, PG). */
  brand_code: string;

  /** Category code segment (e.g., MO, NM, HF). */
  category_code: string;

  /** Variant code (e.g., 120, MO400, TCM300). */
  variant_code: string;

  /** Region/market code segment (e.g., CA, CN, UN). */
  region_code: string;

  /** Optional barcode (string or empty). */
  barcode: NullableString;

  /** Optional language tag (e.g., "en-fr"). */
  language: NullableString;

  /** Market region (e.g., "Canada"), nullable. */
  market_region: NullableString;

  /** Display size label (e.g., "60 Softgels"). */
  size_label: NullableString;

  /** Optional SKU description. */
  description: NullableString;

  /** Dimensions (optional, positive numbers). */
  length_cm: NullableNumber;
  width_cm: NullableNumber;
  height_cm: NullableNumber;

  /** Weight (grams), optional. */
  weight_g: NullableNumber;
}

/**
 * Bulk creation payload for multiple SKUs.
 * Mirrors the backend Joi validator: createSkuBulkSchema
 */
export interface CreateSkuBulkInput {
  /** Array of SKU creation payloads (1–200 items). */
  skus: CreateSkuInput[];
}

/**
 * API response for creating one or many SKUs.
 *
 * Combines:
 *  - ApiSuccessResponse<T>
 *  - OperationStats for timing + processing summary
 *  - Created SKU array
 */
export type CreateSkuResponse = ApiSuccessResponse<CreatedSkuRecord[]>;

/**
 * Individual created SKU entry returned by the API.
 */
export interface CreatedSkuRecord {
  /** UUID of the newly created SKU. */
  id: string;

  /** Generated SKU code (e.g., "CJ-IUM500-S-CN"). */
  skuCode: string;
}

/**
 * Redux slice state for SKU creation operations.
 *
 * Extends the generic `AsyncState<T>` pattern used throughout the app,
 * providing:
 *   - `data`: API response containing created SKU records (or null before creation)
 *   - `loading`: indicates an in-progress create request
 *   - `error`: error message if the request fails
 *
 * This state is used by dialogs, forms, or bulk SKU creation workflows.
 *
 * @example
 * const { loading, data, error } = useSelector(selectCreateSkusState);
 * const isSuccess = !!data;
 *
 * @see AsyncState
 * @see CreateSkuResponse
 */
export type CreateSkusState = AsyncState<CreateSkuResponse | null>;

/**
 * Request payload for updating a SKU's status.
 *
 * Used by the PATCH endpoint:
 *    PATCH /skus/:skuId/status
 *
 * This operation updates only the status field of a SKU, and therefore
 * the payload consists solely of a `statusId` value. The field must be
 * a valid UUID, as validated by the shared `updateStatusIdSchema`.
 *
 * This type reuses the generic `UpdateStatusIdRequest` interface to
 * ensure consistency across all modules that support status updates.
 */
export type UpdateSkuStatusRequestBody = UpdateStatusIdRequest;

/**
 * The inner `data` payload returned by the API
 * when a SKU status update operation succeeds.
 */
export interface UpdateSkuStatusResponseData {
  /** The ID of the SKU whose status was updated */
  id: string;
}

/**
 * Full API success envelope returned after updating a SKU's status.
 *
 * Structure:
 *   {
 *     success: boolean;
 *     message: string;
 *     data: {
 *        id: string;
 *     }
 *   }
 */
export type UpdateSkuStatusResponse =
  ApiSuccessResponse<UpdateSkuStatusResponseData>;

/**
 * Arguments accepted by the Redux thunk responsible for updating
 * a SKU's status.
 *
 * This type ensures a consistent payload shape across:
 *   - Redux thunks
 *   - hooks (e.g., useSkuStatus)
 *   - components invoking the update action
 */
export interface UpdateSkuStatusThunkArgs {
  /** The ID of the SKU to update */
  skuId: string;

  /** The new status to apply to the SKU */
  statusId: string;
}

/**
 * Redux slice state structure for the SKU status update workflow.
 *
 * Uses the shared `AsyncState<T>` pattern:
 *   {
 *     data: UpdateSkuStatusResponse | null;
 *     loading: boolean;
 *     error: string | null;
 *   }
 *
 * This makes SKU status updates consistent with all other async
 * interactions in the SKU domain (create, fetch, bulk operations, etc.)
 */
export type SkuStatusState = AsyncState<UpdateSkuStatusResponse | null>;

/**
 * Represents the minimal SKU metadata required when selecting SKUs
 * for batch operations such as image uploads, status updates, or
 * bulk configuration editing.
 *
 * This interface is typically passed through router state or form state
 * and is intentionally lightweight to avoid loading full SKU detail payloads.
 */
export interface SelectedSku {
  /**
   * Unique identifier of the SKU (UUID from the database).
   * Used as the primary reference for all SKU-level operations.
   */
  skuId: string;

  /**
   * Human-readable SKU code used for product labeling,
   * warehouse operations, and UI display.
   */
  skuCode: string;

  /**
   * Display-friendly product name associated with the SKU.
   * Used to show context to users without requiring the full product record.
   */
  displayProductName: string;
}

/**
 * Generic response payload returned by SKU update operations.
 *
 * Many SKU update endpoints (metadata, dimensions, identity, status)
 * return only the identifier of the updated SKU.
 *
 * This interface is shared across those operations to avoid duplication.
 */
export interface UpdateSkuResponseData {
  /** Unique identifier of the updated SKU */
  id: string;
}

/**
 * Request payload for updating SKU metadata.
 *
 * All fields are optional, but at least one must be provided
 * according to backend validation rules.
 */
export interface UpdateSkuMetadataRequest {
  /** Human-readable package size label (e.g. "120 Capsules") */
  size_label?: string;

  /** Language code used for the SKU metadata (e.g. "en", "fr") */
  language?: string;

  /** Target market region for the SKU (e.g. "Canada", "US") */
  market_region?: string;

  /** Marketing or product description */
  description?: string;
}

/**
 * API response returned after updating SKU metadata.
 */
export type UpdateSkuMetadataResponse =
  ApiSuccessResponse<UpdateSkuResponseData>;

/**
 * Redux async state for SKU metadata update operations.
 *
 * Stores:
 * - API response data
 * - loading state
 * - error payload
 */
export type UpdateSkuMetadataState =
  AsyncState<UpdateSkuMetadataResponse | null>;

/**
 * Request payload for updating SKU physical dimensions.
 *
 * Units are explicitly defined in the field names to avoid
 * ambiguity across shipping and logistics integrations.
 */
export interface UpdateSkuDimensionsRequest {
  /** Product length in centimeters */
  length_cm?: number;

  /** Product width in centimeters */
  width_cm?: number;

  /** Product height in centimeters */
  height_cm?: number;

  /** Product weight in grams */
  weight_g?: number;
}

/**
 * API response returned after updating SKU dimensions.
 */
export type UpdateSkuDimensionsResponse =
  ApiSuccessResponse<UpdateSkuResponseData>;

/**
 * Redux async state for SKU dimension update operations.
 */
export type UpdateSkuDimensionsState =
  AsyncState<UpdateSkuDimensionsResponse | null>;

/**
 * Request payload for updating SKU identity fields.
 *
 * These fields define the SKU's commercial identity used
 * across sales channels, inventory systems, and barcoding.
 */
export interface UpdateSkuIdentityRequest {
  /** SKU code used internally for inventory and product identification */
  sku?: string;

  /** Product barcode (UPC/EAN/GTIN depending on region) */
  barcode?: string;
}

/**
 * API response returned after updating SKU identity.
 */
export type UpdateSkuIdentityResponse =
  ApiSuccessResponse<UpdateSkuResponseData>;

/**
 * Redux async state for SKU identity update operations.
 */
export type UpdateSkuIdentityState =
  AsyncState<UpdateSkuIdentityResponse | null>;

/**
 * Form values used when editing SKU metadata.
 *
 * These fields represent descriptive attributes that define
 * how the SKU is presented in different markets and languages.
 *
 * Used by:
 * - UpdateSkuMetadataForm
 * - metadata edit dialogs
 * - metadata transformers
 */
export interface UpdateSkuMetadataFormValues {
  /** Human-readable product size label (e.g., "60 Capsules", "120 Softgels") */
  sizeLabel?: string;

  /** Language code associated with the SKU (e.g., "EN", "FR", "CN") */
  language?: string;

  /** Target market region for this SKU (e.g., "CA", "US", "EU") */
  marketRegion?: string;

  /** Product description displayed to customers */
  description?: string;
}

/**
 * Form values used when editing SKU physical dimensions.
 *
 * These values describe the physical characteristics of the SKU
 * used for logistics, shipping calculations, and warehouse operations.
 *
 * Used by:
 * - UpdateSkuDimensionsForm
 * - dimension edit dialogs
 * - dimension transformers
 */
export interface UpdateSkuDimensionsFormValues {
  /** Product length in centimeters */
  lengthCm?: number;

  /** Product width in centimeters */
  widthCm?: number;

  /** Product height in centimeters */
  heightCm?: number;

  /** Product weight in grams */
  weightG?: number;
}
