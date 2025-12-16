import {
  DateRange,
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig,
} from '@shared-types/api';

/**
 * Lightweight SKU snapshot associated with a compliance record.
 *
 * Used for list views and joins; not a full SKU entity.
 */
export interface ComplianceSku {
  /** SKU unique identifier (UUID) */
  id: string;
  
  /** SKU code (e.g. CH-HN100-R-CN) */
  sku: string;
  
  /** Human-readable size label (e.g. "60 Capsules") */
  sizeLabel: string;
  
  /** Market region the SKU is registered for (e.g. "China") */
  marketRegion: string;
}

/**
 * Lightweight product snapshot associated with a compliance record.
 *
 * Used for display and filtering purposes only.
 */
export interface ComplianceProduct {
  /** Product unique identifier (UUID) */
  id: string;
  
  /** Base product name */
  name: string;
  
  /** Brand name (e.g. Canaherb) */
  brand: string;
  
  /** Product series or line */
  series: string;
  
  /** Product category */
  category: string;
  
  /** Pre-formatted display name for UI usage */
  displayName: string;
}

/**
 * Represents a single compliance record (e.g. NPN, certification, license).
 *
 * This is the canonical list-level compliance entity returned by
 * paginated compliance APIs.
 */
export interface ComplianceRecord {
  /** Compliance record unique identifier (UUID) */
  id: string;
  
  /** Compliance type (e.g. "NPN") */
  type: string;
  
  /** Official document or registration number */
  documentNumber: string;
  
  /** Date the compliance document was issued (ISO 8601) */
  issuedDate: string;
  
  /**
   * Current compliance status.
   * Example values: active, inactive, archived
   */
  status: GenericStatus;
  
  /**
   * Audit metadata for creation and last update.
   */
  audit: GenericAudit;
  
  /** Associated SKU snapshot */
  sku: ComplianceSku;
  
  /** Associated product snapshot */
  product: ComplianceProduct;
}

/**
 * Standard paginated API response for compliance records.
 */
export type PaginatedComplianceRecordResponse =
  PaginatedResponse<ComplianceRecord>;

/**
 * Date range filters applicable to compliance records.
 *
 * Each field represents an optional inclusive date range.
 */
export interface ComplianceDateRanges {
  /** Filter by record creation date */
  created?: DateRange;
  
  /** Filter by last update date */
  updated?: DateRange;
  
  /** Filter by issued date */
  issued?: DateRange;
  
  /** Filter by expiry date */
  expiry?: DateRange;
}

/**
 * Composite filter object for querying compliance records.
 *
 * All fields are optional and combinable.
 */
export interface ComplianceFilters {
  // --------------------------------------------------
  // Compliance-level filters
  // --------------------------------------------------
  
  /** Compliance type (e.g. "NPN") */
  type?: string;
  
  /** Filter by one or more status IDs */
  statusIds?: string[];
  
  /** Compliance document number */
  complianceId?: string;
  
  /** User ID who created the record */
  createdBy?: string;
  
  /** User ID who last updated the record */
  updatedBy?: string;
  
  // --------------------------------------------------
  // SKU-level filters
  // --------------------------------------------------
  
  /** Filter by one or more SKU IDs */
  skuIds?: string[];
  
  /** SKU code (supports partial match depending on backend) */
  sku?: string;
  
  /** SKU size label */
  sizeLabel?: string;
  
  /** Market region */
  marketRegion?: string;
  
  // --------------------------------------------------
  // Product-level filters
  // --------------------------------------------------
  
  /** Filter by one or more product IDs */
  productIds?: string[];
  
  /** Product name */
  productName?: string;
  
  /** Brand name */
  brand?: string;
  
  /** Product category */
  category?: string;
  
  // --------------------------------------------------
  // Keyword search
  // --------------------------------------------------
  
  /** Fuzzy keyword search across supported fields */
  keyword?: string;
  
  // --------------------------------------------------
  // Date range filters
  // --------------------------------------------------
  
  /** Grouped date range filters */
  dateRanges?: ComplianceDateRanges;
}

/**
 * Supported sort field keys for compliance records.
 *
 * These values are used by the UI and mapped to
 * safe database columns on the server.
 */
export type ComplianceRecordSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'issuedDate'
  | 'expiryDate'
  | 'complianceNumber'
  | 'productName'
  | 'skuCode'
  | 'status'
  | 'defaultNaturalSort';

/**
 * Query parameters for fetching paginated compliance records.
 *
 * Combines pagination, sorting, and filtering options.
 */
export interface GetPaginatedComplianceRecordsParams
  extends PaginationParams, SortConfig {
  
  /** Optional filter object */
  filters?: ComplianceFilters;
}

/**
 * Redux state shape for paginated compliance records.
 *
 * Used by list pages and table-driven components.
 */
export type ComplianceRecordsState =
  ReduxPaginatedState<ComplianceRecord>;

/**
 * Flat compliance record row for table/list views.
 *
 * Derived from ComplianceRecord.
 * Safe for sorting, filtering, and rendering.
 */
export interface ComplianceRecordTableRow {
  // --------------------------------------------------
  // Identity
  // --------------------------------------------------
  id: string;
  
  // --------------------------------------------------
  // Compliance
  // --------------------------------------------------
  type: string;
  documentNumber: string;
  issuedDate: string;
  
  // --------------------------------------------------
  // Status
  // --------------------------------------------------
  statusId: string;
  statusName: string;
  statusDate: string;
  
  // --------------------------------------------------
  // SKU
  // --------------------------------------------------
  skuId: string;
  skuCode: string;
  sizeLabel: string;
  marketRegion: string;
  
  // --------------------------------------------------
  // Product
  // --------------------------------------------------
  productId: string;
  productName: string;
  brand: string;
  series: string;
  category: string;
  productDisplayName: string;
  
  // --------------------------------------------------
  // Audit
  // --------------------------------------------------
  createdAt: string;
  createdById: string | null;
  createdByName: string;
  updatedAt: string | null;
  updatedById: string | null;
  updatedByName: string;
}
