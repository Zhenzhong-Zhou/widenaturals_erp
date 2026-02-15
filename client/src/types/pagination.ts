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
 * Canonical Redux state shape for paginated collections.
 *
 * This interface is intended to be reused across all paginated slices
 * (e.g. orders, inventory, fulfillments, order types).
 *
 * ### Design principles
 * - Keeps API response models out of Redux
 * - Stores UI-ready data only
 * - Supports consistent error handling and debugging
 *
 * @template T - Flattened, UI-ready row type
 */
export interface ReduxPaginatedState<T> {
  /**
   * Paginated data records.
   * Must always be an array (never null) to simplify UI rendering.
   */
  data: T[];

  /**
   * Pagination metadata returned from the backend.
   * Null before the first successful fetch.
   */
  pagination: Pagination | null;

  /**
   * Indicates whether a paginated request is currently in flight.
   * Used for skeletons, spinners, and disabling controls.
   */
  loading: boolean;

  /**
   * Human-readable error message for UI display.
   * Null when no error has occurred.
   */
  error: string | null;

  /**
   * Optional backend trace ID associated with the last failed request.
   *
   * Useful for:
   * - Support and debugging
   * - Correlating frontend errors with backend logs
   *
   * This value is cleared on successful requests.
   */
  traceId?: string | null;
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
