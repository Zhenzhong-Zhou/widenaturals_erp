import {
  GenericAudit,
  GenericStatus,
  PaginatedResponse,
  PaginationParams,
  SortConfig
} from '@shared-types/api';
import { NullableString } from '@shared-types/shared';
import { ReduxPaginatedState } from '@shared-types/pagination';

/**
 * Domain-level Location Type record
 *
 * Mirrors the backend API response structure.
 * Contains nested status and audit metadata.
 *
 * This model should only be used:
 * - In API layer
 * - In service/repository transformers
 *
 * It should NOT be stored directly in Redux state.
 */
export interface LocationTypeRecord {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Machine-readable facility type code */
  code: string;
  
  /** Human-readable facility type name */
  name: string;
  
  /** Optional description of the facility type */
  description: NullableString;
  
  /** Current status metadata */
  status: GenericStatus;
  
  /** Audit metadata (creation & update tracking) */
  audit: GenericAudit;
}

/**
 * Flattened Location Type record
 *
 * Used exclusively in UI layer and Redux state.
 *
 * Flattening avoids deep property access in tables,
 * sorting, filtering, and memoized selectors.
 *
 * This model is derived via transformer from LocationTypeRecord.
 */
export interface FlattenedLocationTypeRecord {
  // --------------------------------------------------
  // Core identity
  // --------------------------------------------------
  
  /** Unique identifier (UUID) */
  id: string;
  
  /** Machine-readable facility type code */
  code: string;
  
  /** Human-readable facility type name */
  name: string;
  
  /** Optional description */
  description: NullableString;
  
  // --------------------------------------------------
  // Status (flattened)
  // --------------------------------------------------
  
  /** Status ID */
  statusId: string;
  
  /** Status display name */
  statusName: string;
  
  /** Status effective date (ISO timestamp) */
  statusDate: string;
  
  // --------------------------------------------------
  // Audit (flattened)
  // --------------------------------------------------
  
  /** Record creation timestamp */
  createdAt: string;
  
  /** Creator user ID */
  createdById: NullableString;
  
  /** Creator display name */
  createdByName: string;
  
  /** Last update timestamp */
  updatedAt: NullableString;
  
  /** Last updater user ID */
  updatedById: NullableString;
  
  /** Last updater display name */
  updatedByName: NullableString;
}

/**
 * Allowed sorting fields for Location Type list.
 *
 * Must remain aligned with backend `locationTypeSortMap`.
 *
 * Note:
 * - `defaultNaturalSort` exists for backend fallback safety.
 * - Consider whether it should be exposed in UI controls.
 */
export type LocationTypeSortField =
  | 'name'
  | 'statusName'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'defaultNaturalSort';

/**
 * Filter options for Location Type list queries.
 *
 * Used inside `LocationTypeListQueryParams.filters`.
 * All fields are optional and applied conditionally.
 */
export interface LocationTypeListFilters {
  /** Filter by one or multiple status IDs */
  statusIds?: string | string[];
  
  /** Partial match on name */
  name?: string;
  
  /** Filter by creator user ID */
  createdBy?: string;
  
  /** Filter by updater user ID */
  updatedBy?: string;
  
  /** Created date range start (inclusive) */
  createdAfter?: string;
  
  /** Created date range end (inclusive) */
  createdBefore?: string;
  
  /** Updated date range start (inclusive) */
  updatedAfter?: string;
  
  /** Updated date range end (inclusive) */
  updatedBefore?: string;
  
  /** Keyword search across code and name */
  keyword?: string;
}

/**
 * Query parameters for paginated Location Type list endpoint.
 *
 * Extends:
 * - PaginationParams (page, limit)
 * - SortConfig (sortBy, sortOrder)
 *
 * Filters are grouped to keep query contract modular
 * and consistent with other ERP list modules.
 */
export interface LocationTypeListQueryParams
  extends PaginationParams,
    SortConfig {
  filters?: LocationTypeListFilters;
}

/**
 * API response shape returned by backend
 * for paginated Location Type list endpoint.
 *
 * Contains nested domain model.
 */
export type PaginatedLocationTypeApiResponse =
  PaginatedResponse<LocationTypeRecord>;

/**
 * Redux state slice shape for paginated Location Type list.
 *
 * Uses flattened record for UI efficiency.
 */
export type PaginatedLocationTypeState =
  ReduxPaginatedState<FlattenedLocationTypeRecord>;

/**
 * UI-consumed paginated response.
 *
 * Used after transformation from API model
 * into flattened UI model.
 */
export type PaginatedLocationTypeListUiResponse =
  PaginatedResponse<FlattenedLocationTypeRecord>;
