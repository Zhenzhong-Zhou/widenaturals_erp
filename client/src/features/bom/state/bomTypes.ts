import type {
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig
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
  bom: BomSummary;
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
export interface BomSummary {
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
