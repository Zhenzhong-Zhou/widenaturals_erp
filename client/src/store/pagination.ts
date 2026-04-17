import type { PaginatedLookupState } from '@shared-types/api';
import type {
  Pagination,
  ReduxPaginatedState
} from '@shared-types/pagination';

/**
 * Creates an initial pagination state with sensible defaults.
 *
 * @param limit - Number of records per page (defaults to 10).
 * @returns A fresh Pagination object starting at page 1 with zero records.
 */
export const createInitialPagination = (limit: number = 10): Pagination => ({
  page: 1,
  limit,
  totalPages: 0,
  totalRecords: 0,
});

/**
 * Creates a standardized initial Redux state for paginated slices.
 *
 * This helper ensures every paginated feature (tables, lists, reports)
 * starts with a consistent, UI-safe structure:
 *
 * - `data`        → empty array (never null)
 * - `pagination`  → initialized page/limit metadata
 * - `loading`     → false
 * - `error`       → null
 * - `traceId`     → null (for backend error correlation)
 *
 * Centralizing this logic prevents pagination drift across slices
 * and eliminates repetitive boilerplate.
 *
 * @template T - Flattened, UI-ready row type stored in the list
 * @returns {ReduxPaginatedState<T>} Initialized paginated slice state
 */
export const createInitialPaginatedState = <T>(limit?: number): ReduxPaginatedState<T> => ({
  data: [],
  pagination: createInitialPagination(limit),
  loading: false,
  error: null,
  traceId: null,
});

/**
 * Creates the initial state structure for an offset-based paginated Redux slice.
 *
 * This utility is commonly used to initialize state for dropdowns,
 * autocomplete fields, and infinite scroll components that fetch data
 * incrementally using `limit` and `offset`.
 *
 * @template T - The type of individual items stored in the paginated state
 * @returns A default-initialized paginated state with empty data,
 *          no error, and pagination metadata.
 */
export const createInitialOffsetPaginatedState = <
  T,
>(): PaginatedLookupState<T> => {
  return {
    data: [],
    loading: false,
    error: null,
    limit: 50,
    offset: 0,
    hasMore: false,
  };
};
