import type {
  ApiSuccessResponse, AsyncState,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

/**
 * Root response shape for the paginated BOM list API.
 *
 * Extends the generic `PaginatedResponse<T>` for consistency
 * with all paginated ERP endpoints.
 */
export type FetchPaginatedBomsResponse = PaginatedResponse<BomListItem>;

/**
 * Represents one row in the BOM list.
 * Each row includes linked product, SKU, and BOM metadata.
 */
export interface BomListItem {
  product: ProductSummary;
  sku: SkuSummary;
  bom: BomRow;
}

/**
 * Basic product information linked to a BOM.
 */
export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  series: string;
  category: string;
}

/**
 * SKU-level information associated with a product.
 */
export interface SkuSummary {
  id: string;
  code: string;
  barcode: string;
  language: string;
  countryCode: string;
  marketRegion: string;
  sizeLabel: string;
  description: string;
  compliance: ComplianceInfo | null;
}

/**
 * Compliance metadata (e.g., NPN, FDA, etc.)
 */
export interface ComplianceInfo {
  id: string;
  type: string; // e.g., 'NPN'
  number: string;
  status: string; // e.g., 'active'
  issuedDate: string; // ISO timestamp
  expiryDate?: string | null; // optional future-proofing
}

/**
 * BOM core information.
 */
export interface BomRow {
  id: string;
  code: string;
  name: string;
  revision: number;
  isActive: boolean;
  isDefault: boolean;
  description: string | null;
  status: BomStatus;
  audit: BomAudit;
}

/**
 * BOM status and last updated info.
 */
export interface BomStatus {
  id: string;
  name: string; // e.g., 'active', 'inactive'
  date: string; // ISO timestamp
}

/**
 * Created/updated audit info for a BOM.
 */
export interface BomAudit {
  createdAt: string;
  createdBy: UserRef;
  updatedAt: string | null;
  updatedBy: UserRef | null;
}

/**
 * Lightweight user reference for audit info.
 */
export interface UserRef {
  id: string;
  name: string;
}

/**
 * Supported sort fields for BOM list.
 */
export type BomSortField =
  | 'productName'
  | 'brand'
  | 'series'
  | 'category'
  | 'skuCode'
  | 'complianceType'
  | 'complianceStatus'
  | 'revision'
  | 'isActive'
  | 'isDefault'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'defaultNaturalSort';

/**
 * Filter parameters for fetching BOM list.
 * Mirrors `bomQuerySchema` from the backend.
 */
export interface BomListFilters {
  // --- Core Filters ---
  showBarcode?: boolean;
  skuId?: string | null;
  
  // --- Compliance Filters ---
  complianceStatusId?: string;
  onlyActiveCompliance?: boolean;
  complianceType?: string;
  
  // --- BOM Status ---
  statusId?: string;
  
  // --- Boolean flags ---
  isActive?: boolean;
  isDefault?: boolean;
  
  // --- Revision Range ---
  revisionMin?: number;
  revisionMax?: number;
  
  // --- Audit filters ---
  createdBy?: string;
  updatedBy?: string;
  
  // --- Keyword search ---
  keyword?: string;
}

/**
 * Complete query parameters for fetching BOM list,
 * combining pagination, sorting, and filter support.
 */
export interface FetchBomsParams extends PaginationParams, SortConfig {
  filters?: BomListFilters;
}

/**
 * Redux slice state for the BOM module.
 *
 * Extends the generic `ReduxPaginatedState<T>` for standardized pagination,
 * loading, and error handling, while adding module-specific fields
 * like filters and sort configuration.
 */
export interface PaginatedBomStateWithFilters
  extends ReduxPaginatedState<BomListItem> {
  /** Current applied filters for the BOM list (e.g., status, brand, productName). */
  filters: FetchBomsParams['filters'];
}

/**
 * Flattened BOM record structure used for tables or exports.
 */
export interface FlattenedBomRecord {
  // Product Info
  productId: string;
  productName: string;
  brand: string;
  series: string;
  category: string;
  
  // SKU Info
  skuId: string;
  skuCode: string;
  barcode: string;
  marketRegion: string;
  countryCode: string;
  language: string;
  sizeLabel: string;
  skuDescription: string;
  
  // BOM Info
  bomId: string;
  bomCode: string;
  bomName: string;
  bomDescription: string;
  revision: number;
  isActive: boolean;
  isDefault: boolean;
  
  // Status Info
  status: string;
  statusDate: string;
  
  // Compliance Info
  npnNumber: string;
  complianceType: string;
  complianceIssuedDate: string | null;
  complianceExpiryDate: string | null;
  
  // Audit Info
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/**
 * Response type for the BOM Details API: GET /boms/:bomId/details
 */
export type BomDetailsResponse = ApiSuccessResponse<BomDetailsData>;

/** Root data payload returned by the BOM Details API. */
export interface BomDetailsData {
  header: BomHeader;
  details: BomPartDetail[];
  summary: BomSummary;
}

/** Contains high-level product, SKU, compliance, and BOM information. */
export interface BomHeader {
  product: BomProduct;
  sku: BomSku;
  compliance: BomCompliance;
  bom: BomInfo;
}

/** Represents the core product associated with the BOM. */
export interface BomProduct {
  id: string;
  name: string;
  brand: string;
  series: string;
  category: string;
}

/** Represents the SKU (variant) details for the product. */
export interface BomSku {
  id: string;
  code: string;
  barcode: string;
  language: string;
  countryCode: string;
  marketRegion: string;
  sizeLabel: string;
  description: string;
}

/** Regulatory or compliance information linked to the SKU. */
export interface BomCompliance {
  id: string;
  type: string; // e.g., 'NPN'
  number: string;
  issuedDate: string | null;
  expiryDate: string | null;
  description: string;
  status: BomStatus;
}

/** Describes the Bill of Materials record itself. */
export interface BomInfo {
  id: string;
  code: string;
  name: string;
  revision: number;
  isActive: boolean;
  isDefault: boolean;
  description: string;
  status: BomStatusWithDate;
  audit: BomAudit;
}

/** Represents the current status of the BOM or compliance record. */
export interface BomStatus {
  id: string;
  name: string; // e.g., 'active'
}

/** Extends status with the date of the last update. */
export interface BomStatusWithDate extends BomStatus {
  date: string;
}

/** Represents a specific part and its usage within the BOM. */
export interface BomPartDetail {
  id: string;
  partQtyPerProduct: number;
  unit: string;
  specifications: string | null;
  estimatedUnitCost: number;
  currency: string; // e.g., 'CAD', 'USD', etc.
  exchangeRate: number; // rate relative to CAD
  note: string | null;
  part: BomPart;
  audit: BomAudit;
}

/** Defines a reusable part or material in the BOM structure. */
export interface BomPart {
  id: string;
  code: string;
  name: string;
  type: string;
  unitOfMeasure: string;
  description: string;
}

/** Summarized BOM cost and item count information. */
export interface BomSummary {
  type: 'ESTIMATED' | 'ACTUAL' | string;
  description: string;
  totalEstimatedCost: number;
  currency: string; // normalized currency (CAD)
  itemCount: number;
}

/**
 * Slice state for storing a single BOM's detailed structure and metadata.
 */
export type BomDetailsState = AsyncState<BomDetailsData | null>;

/**
 * A flattened representation of BOM header data,
 * merging product, SKU, compliance, and BOM metadata
 * into a single-level structure for easy display and export.
 */
export interface FlattenedBomHeader {
  // --- Product Info ---
  productId: string | null;
  productName: string | null;
  productBrand: string | null;
  productSeries: string | null;
  productCategory: string | null;
  
  // --- SKU Info ---
  skuId: string | null;
  skuCode: string | null;
  skuBarcode: string | null;
  skuLanguage: string | null;
  skuCountryCode: string | null;
  skuMarketRegion: string | null;
  skuSizeLabel: string | null;
  skuDescription: string | null;
  
  // --- Compliance Info ---
  complianceId: string | null;
  complianceType: string | null;
  complianceNumber: string | null;
  complianceIssuedDate: string | null;
  complianceExpiryDate: string | null;
  complianceDescription: string | null;
  complianceStatus: string | null;
  
  // --- BOM Info ---
  bomId: string | null;
  bomCode: string | null;
  bomName: string | null;
  bomRevision: number | null;
  bomIsActive: boolean | null;
  bomIsDefault: boolean | null;
  bomDescription: string | null;
  bomStatus: string | null;
  bomStatusDate: string | null;
  bomCreatedAt: string | null;
  bomCreatedBy: string | null;
  bomUpdatedAt: string | null;
  bomUpdatedBy: string | null;
}

/**
 * Represents a flattened view of a BOM summary,
 * suitable for display or tabular export.
 */
export interface FlattenedBomSummary {
  /** Summary type, e.g. "ESTIMATED" or "ACTUAL". */
  summaryType: string | null;
  
  /** Description of how the summary was calculated. */
  summaryDescription: string | null;
  
  /** Total cost normalized to CAD or a standard currency. */
  summaryTotalEstimatedCost: number | null;
  
  /** The currency used for total cost (e.g. "CAD"). */
  summaryCurrency: string | null;
  
  /** Total count of items in the BOM. */
  summaryItemCount: number | null;
}

/**
 * Type definition for a flattened BOM part detail row.
 * Derived from your flattening function result.
 */
export interface FlattenedBomDetailRow {
  bomItemId: string;
  partId: string | null;
  partCode: string | null;
  partName: string | null;
  partType: string | null;
  partQtyPerProduct: number | null;
  unit: string | null;
  partUnitOfMeasure: string | null;
  partDescription: string | null;
  estimatedUnitCost: number | null;
  currency: string | null;
  exchangeRate: number | null;
  specifications: string | null;
  note: string | null;
  estimatedCostCAD: number | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}
