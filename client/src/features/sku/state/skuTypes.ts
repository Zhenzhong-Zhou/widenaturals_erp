import type {
  ApiSuccessResponse,
  AsyncState,
  AuditUser,
  GenericAudit,
  GenericStatus,
} from '@shared-types/api';

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
