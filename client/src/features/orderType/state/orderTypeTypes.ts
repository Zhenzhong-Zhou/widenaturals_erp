import {
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig,
} from '@shared-types/api';
import type { ReduxPaginatedState } from '@shared-types/pagination';

/**
 * Filter parameters for querying order types.
 */
export interface OrderTypeFilters {
  /** Filter by name (partial match) */
  name?: string | null;

  /** Filter by code (partial match) */
  code?: string | null;

  /** Filter by category (e.g., 'logistics', 'finance') */
  category?: string | null;

  /** Filter by status ID */
  statusId?: string;

  /** Filter by whether payment is required */
  requiresPayment?: boolean;

  /** Filter by user ID who created the order type */
  createdBy?: string;

  /** Filter by user ID who last updated the order type */
  updatedBy?: string;

  /** Full-text keyword search across fields */
  keyword?: string;

  /** Filter by created date after this ISO timestamp (inclusive) */
  createdAfter?: string;

  /** Filter by created date before this ISO timestamp (inclusive) */
  createdBefore?: string;

  /** Filter by updated date after this ISO timestamp (inclusive) */
  updatedAfter?: string;

  /** Filter by updated date before this ISO timestamp (inclusive) */
  updatedBefore?: string;
}

/**
 * Sortable fields for order types.
 */
export type OrderTypeSortBy =
  | 'name'
  | 'code'
  | 'category'
  | 'requiresPayment'
  | 'description'
  | 'statusName'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'defaultNaturalSort';

/**
 * Parameters for fetching paginated and sorted order type records.
 */
export interface FetchPaginatedOrderTypesParams
  extends PaginationParams, SortConfig {
  /** Optional filtering options */
  filters?: OrderTypeFilters;
}

/**
 * Represents a single order type record in a list.
 */
export interface OrderTypeListItem {
  /** Unique ID of the order type */
  id: string;

  /** Display name of the order type */
  name: string;
  
  /** Unique code of the order type (used for system integration or lookup) */
  code: string;

  /** Category of the order type (e.g., 'logistics') */
  category: string;

  /** Whether this order type requires payment */
  requiresPayment: boolean;
  
  /**
   * Current compliance status.
   * Example values: active, inactive, archived
   */
  status: GenericStatus;
  
  /**
   * Audit metadata for creation and last update.
   */
  audit: GenericAudit;
}

/**
 * Paginated response for order type list queries.
 */
export type OrderTypeListResponse = PaginatedResponse<OrderTypeListItem>;

/**
 * Redux state for a paginated order type list.
 */
export type PaginatedOrderTypeListState =
  ReduxPaginatedState<OrderTypeListItem>;

/**
 * FlattenedOrderTypeRecord
 *
 * UI-optimized, flat representation of an order type.
 *
 * Intended for:
 * - table and list rendering
 * - client-side sorting and filtering
 * - CSV / Excel export
 * - Redux paginated state
 *
 * This interface is **presentation-only** and intentionally
 * denormalized. It should NOT be used for write operations.
 */
export interface FlattenedOrderTypeRecord {
  /** Unique identifier */
  id: string;
  
  /** Display name of the order type */
  name: string;
  
  /** System code (used for integration / lookup) */
  code: string;
  
  /** Business category (e.g. logistics, sales, procurement) */
  category: string;
  
  /** Whether payment is required for this order type */
  requiresPayment: boolean;
  
  // ─────────────────────────────
  // Status (flattened)
  // ─────────────────────────────
  
  /** Status identifier */
  statusId: string | null;
  
  /** Status display name (e.g. Active, Inactive) */
  statusName: string;
  
  /** Status effective date (ISO string) */
  statusDate: string | null;
  
  // ─────────────────────────────
  // Audit (flattened)
  // ─────────────────────────────
  
  /** Created timestamp (ISO string) */
  createdAt: string | null;
  
  /** Creator identifier or name */
  createdBy: string | null;
  
  /** Last updated timestamp (ISO string) */
  updatedAt: string | null;
  
  /** Last updater identifier or name */
  updatedBy: string | null;
}
