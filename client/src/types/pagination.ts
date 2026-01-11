/**
 * ======================================================
 * Pagination domain types
 * ======================================================
 */

/**
 * Offset-based pagination input.
 * Used by lookup endpoints and infinite scroll queries.
 */
export interface LookupPagination {
  /** Maximum number of records to return */
  limit?: number;
  
  /** Number of records to skip */
  offset?: number;
}

/**
 * Pagination metadata for lookup-style responses.
 */
export interface PaginationLookupInfo extends LookupPagination {
  /** Indicates whether more records are available */
  hasMore: boolean;
}

/**
 * Standard pagination metadata used across the application.
 *
 * Page numbers are 1-based.
 */
export interface Pagination {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
}

/**
 * Redux-managed state shape for paginated data.
 */
export interface ReduxPaginatedState<T> {
  data: T[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

/**
 * ======================================================
 * Pagination defaults
 * ======================================================
 */

/**
 * Canonical default pagination state.
 *
 * Used for:
 * - Local component state
 * - Redux initialization
 * - Pagination normalization fallbacks
 */
export const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: 25,
  totalRecords: 0,
  totalPages: 0,
};
