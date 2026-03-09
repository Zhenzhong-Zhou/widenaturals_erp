/**
 * ======================================================
 * Pagination domain types
 * ======================================================
 */

import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

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
 * Design principles:
 * - Keeps API response models out of Redux
 * - Stores UI-ready data only
 * - Uses structured {@link UiErrorPayload} for consistent error handling
 *
 * @template T - Flattened, UI-ready row type
 */
export interface ReduxPaginatedState<T> {
  /**
   * Paginated data records.
   */
  data: T[];

  /**
   * Pagination metadata returned from the backend.
   */
  pagination: Pagination | null;

  /**
   * Indicates whether a paginated request is currently in flight.
   */
  loading: boolean;

  /**
   * Structured UI-safe error payload.
   * Null when no error has occurred.
   */
  error: UiErrorPayload | null;

  /**
   * Optional backend trace ID associated with the last failed request.
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
