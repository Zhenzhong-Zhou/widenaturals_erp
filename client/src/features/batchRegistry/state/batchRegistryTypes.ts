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
 * Represents the raw, domain-level response returned by the backend.
 * Records preserve relational structure and are not UI-optimized.
 *
 * Pagination metadata is passed through without transformation.
 */
export type PaginatedBatchRegistryApiResponse =
  PaginatedResponse<BatchRegistryRecord>;

/**
 * Paginated UI response for batch registry records.
 *
 * Contains **flattened, presentation-ready batch registry records**
 * produced by the thunk transformer layer.
 *
 * Responsibilities:
 * - Uses flattened records optimized for tables, filtering, and export
 * - Preserves backend pagination metadata without transformation
 *
 * This type represents the data shape consumed by Redux state
 * and UI components — not the raw API contract.
 */
export type PaginatedBatchRegistryListResponse =
  PaginatedResponse<FlattenedBatchRegistryRecord>;

/**
 * Discriminated union representing a batch registry record.
 *
 * The `type` field determines which concrete shape is present.
 */
export type BatchRegistryRecord =
  | ProductBatchRegistryRecord
  | PackagingMaterialBatchRegistryRecord;

/**
 * BaseBatchRegistryRecord
 *
 * Base interface defining fields shared by all batch registry records,
 * regardless of underlying batch entity type.
 *
 * This interface represents a **domain-level batch registry record**
 * and preserves normalized relationships and typed metadata.
 *
 * Intended usage:
 * - Service and business layer data contracts
 * - API responses for detail views
 * - Inputs to transformers (e.g. flattening for UI)
 *
 * Not intended for:
 * - Direct Redux storage
 * - Table/list rendering without transformation
 */
interface BaseBatchRegistryRecord {
  /** Unique batch registry identifier */
  id: string;
  
  /** Discriminator for the underlying batch entity type */
  type: BatchEntityType;
  
  /** Batch lot number */
  lotNumber: string;
  
  /** Expiry date (ISO string) or null if not applicable */
  expiryDate: NullableString;
  
  /** Current batch status (id, name, effective date) */
  status: GenericStatus;
  
  /** Optional registry note */
  note: NullableString;
  
  /** Timestamp when the batch was registered */
  registeredAt: string;
  
  /** Actor identity who registered the batch */
  registeredBy: ActorIdentity;
}

/**
 * PackagingMaterialBatchRegistryRecord
 *
 * Domain-level batch registry record for **packaging material batches**.
 *
 * Extends the base registry fields with packaging-specific metadata,
 * preserving normalized relationships to packaging material and supplier
 * entities.
 *
 * Notes:
 * - `type` is a strict discriminator and always `'packaging_material'`
 * - This structure is intentionally nested and should be flattened
 *   before use in table-based UI or Redux state
 */
export interface PackagingMaterialBatchRegistryRecord
  extends BaseBatchRegistryRecord {
  /** Discriminator for packaging material batch records */
  type: 'packaging_material';
  
  /** Packaging material batch identifier */
  packagingBatchId: string;
  
  /** Human-readable display name for the packaging batch */
  packagingDisplayName: string;
  
  /** Packaging material reference */
  packagingMaterial: {
    /** Packaging material identifier */
    id: string;
    
    /** Packaging material code */
    code: string;
  };
  
  /** Supplier reference */
  supplier: {
    /** Supplier identifier */
    id: string;
    
    /** Supplier display name */
    name: string;
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
 * REDUX STATE — BATCH REGISTRY
 * ======================================================= */

/**
 * Redux paginated state for Batch Registry domain records.
 *
 * This state stores **flattened, UI-ready batch registry records**
 * derived from the API response via a transformer layer.
 *
 * Records in this slice are optimized for list rendering,
 * pagination, filtering, and sorting. They intentionally
 * trade relational structure for a stable, display-oriented shape.
 *
 * Raw API records and entity relationships should not be stored
 * directly in this state.
 *
 * NOTE:
 * - API responses → BatchRegistryRow (relational)
 * - Transformer → FlattenedBatchRegistryRecord
 * - Redux paginated state → stores flattened records only
 */
export type PaginatedBatchRegistryState =
  ReduxPaginatedState<FlattenedBatchRegistryRecord>;

/**
 * FlattenedBatchRegistryRecord
 *
 * A **flattened, presentation-layer representation** of a batch registry entry.
 *
 * This interface intentionally denormalizes data from multiple backend sources
 * (batch registry, status, product/SKU, packaging material, manufacturer/supplier)
 * into a single, table-friendly structure.
 *
 * Design goals:
 * - Optimized for Redux storage
 * - Easy table rendering (no nested access)
 * - Stable keys for sorting, filtering, and pagination
 * - Supports both product batches and packaging-material batches
 *
 * Notes:
 * - Fields not applicable to the current `batchType` will be null or empty.
 * - This is NOT a domain entity and should not be used for write operations.
 */
export interface FlattenedBatchRegistryRecord {
  /* -------------------------------------------------------
   * Core registry identity
   * ----------------------------------------------------- */
  
  /** Unique registry record identifier */
  id: string;
  
  /** Type of batch registered */
  batchType: BatchEntityType;
  
  /** Lot or batch number (product or packaging) */
  lotNumber: string;
  
  /** Expiry date (ISO string); null if not applicable */
  expiryDate: NullableString;
  
  /* -------------------------------------------------------
   * Status
   * ----------------------------------------------------- */
  
  /** Human-readable batch status */
  status: string;
  
  /** Status effective date (ISO string) */
  statusDate: string;
  
  /* -------------------------------------------------------
   * Registry audit metadata
   * ----------------------------------------------------- */
  
  /** Timestamp when the batch was registered */
  registeredAt: string;
  
  /** Display name of the user who registered the batch */
  registeredBy: string;
  
  /** Optional registry note */
  note: NullableString;
  
  /* -------------------------------------------------------
   * Product batch fields (batchType === 'product')
   * ----------------------------------------------------- */
  
  /** Product identifier */
  productId: NullableString;
  
  /** Product display name */
  productName: string;
  
  /** SKU code associated with the batch */
  skuCode: string;
  
  /** Manufacturer name */
  manufacturerName: string;
  
  /* -------------------------------------------------------
   * Packaging material batch fields (batchType === 'packaging_material')
   * ----------------------------------------------------- */
  
  /** Packaging material batch identifier */
  packagingBatchId: NullableString;
  
  /** Display name for packaging material */
  packagingDisplayName: string;
  
  /** Packaging material code */
  packagingMaterialCode: string;
  
  /** Supplier name */
  supplierName: string;
}
