import type {
  ActorIdentity,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { BatchEntityType } from '@shared-types/batch';
import type { NullableString } from '@shared-types/shared';
import { ReduxPaginatedState } from '@shared-types/pagination';

/* =========================================================
 * API RESPONSE TYPES
 * ======================================================= */

/**
 * Paginated API response for batch registry records.
 *
 * Preserves backend pagination metadata without transformation.
 */
export type PaginatedBatchRegistryListResponse =
  PaginatedResponse<BatchRegistryRecord>;

/**
 * Discriminated union representing a batch registry record.
 *
 * The `type` field determines which concrete shape is present.
 */
export type BatchRegistryRecord =
  | ProductBatchRegistryRecord
  | PackagingMaterialBatchRegistryRecord;

/**
 * Base fields shared by all batch registry records.
 */
interface BaseBatchRegistryRecord {
  /** Unique batch registry identifier */
  id: string;
  
  /** Domain-level batch entity type */
  type: BatchEntityType;
  
  /** Batch lot number */
  lotNumber: string;
  
  /** Expiry date (ISO string) or null if not applicable */
  expiryDate: NullableString;
  
  /** Current batch status */
  status: GenericStatus;
  
  /** Timestamp when the batch was registered */
  registeredAt: string;
  
  /** Actor who registered the batch */
  registeredBy: ActorIdentity;
}

/**
 * Batch registry record for packaging material batches.
 */
export interface PackagingMaterialBatchRegistryRecord
  extends BaseBatchRegistryRecord {
  type: 'packaging_material';
  
  /** Packaging batch identifier */
  packagingBatchId: string;
  
  /** Packaging material metadata */
  packagingMaterial: {
    id: string;
    name: string;
    supplier: {
      id: string;
      name: string;
    };
  };
}

/**
 * Batch registry record for product batches.
 */
export interface ProductBatchRegistryRecord
  extends BaseBatchRegistryRecord {
  type: 'product';
  
  /** Product batch identifier */
  productBatchId: string;
  
  /** Product metadata */
  product: {
    id: string;
    name: string;
  };
  
  /** SKU metadata */
  sku: {
    id: string;
    code: string;
  };
  
  /** Manufacturer metadata */
  manufacturer: {
    id: string;
    name: string;
  };
}

/* =========================================================
 * FILTERING & QUERY TYPES
 * ======================================================= */

/**
 * Domain-level filters for querying batch registry records.
 *
 * These fields represent business filtering rules and are
 * independent of pagination or sorting concerns.
 */
export interface BatchRegistryFilters {
  // ----------------------------------------
  // Core registry filters
  // ----------------------------------------
  
  /** Batch entity type (product or packaging material) */
  batchType?: BatchEntityType;
  
  /** Batch status ID(s) */
  statusIds?: string | string[];
  
  // ----------------------------------------
  // Product batch filters
  // ----------------------------------------
  
  /** SKU ID(s) */
  skuIds?: string | string[];
  
  /** Product ID(s) */
  productIds?: string | string[];
  
  /** Manufacturer ID(s) */
  manufacturerIds?: string | string[];
  
  // ----------------------------------------
  // Packaging batch filters
  // ----------------------------------------
  
  /** Packaging material ID(s) */
  packagingMaterialIds?: string | string[];
  
  /** Supplier ID(s) */
  supplierIds?: string | string[];
  
  // ----------------------------------------
  // Lot
  // ----------------------------------------
  
  /** Exact lot number match */
  lotNumber?: string;
  
  // ----------------------------------------
  // Expiry date filters
  // ----------------------------------------
  
  /** Expiry date lower bound (ISO 8601 date) */
  expiryAfter?: string;
  
  /** Expiry date upper bound (ISO 8601 date) */
  expiryBefore?: string;
  
  // ----------------------------------------
  // Registry audit filters
  // ----------------------------------------
  
  /** Registration date lower bound (ISO 8601 date) */
  registeredAfter?: string;
  
  /** Registration date upper bound (ISO 8601 date) */
  registeredBefore?: string;
  
  // ----------------------------------------
  // Keyword search
  // ----------------------------------------
  
  /** Fuzzy search across lot, product, SKU, material, supplier */
  keyword?: string;
}

/**
 * Supported sort fields for the batch registry list.
 *
 * These map directly to backend-approved SQL sort expressions.
 */
export type BatchRegistrySortField =
  // Core registry identity
  | 'registeredAt'
  | 'batchType'
  
  // Lot & expiry
  | 'lotNumber'
  | 'expiryDate'
  
  // Status
  | 'statusName'
  | 'statusDate'
  
  // Product metadata
  | 'productName'
  | 'skuCode'
  | 'manufacturerName'
  
  // Packaging metadata
  | 'packagingMaterialName'
  | 'supplierName'
  
  // Audit
  | 'registeredBy'
  
  // Fallback
  | 'defaultNaturalSort';

/**
 * Transport-level query parameters for fetching batch registry records.
 *
 * Combines pagination, sorting, and optional domain filters
 * into a single API-ready contract.
 */
export interface BatchRegistryQueryParams
  extends PaginationParams, PaginationParams, SortConfig {
  /** Optional domain filters */
  filters?: BatchRegistryFilters;
}

/* =========================================================
 * REDUX STATE
 * ======================================================= */

/**
 * Redux paginated state for batch registry records.
 */
export type PaginatedBatchRegistryState =
  ReduxPaginatedState<BatchRegistryRecord>;
