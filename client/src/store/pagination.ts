import type { ReduxPaginatedState } from '@shared-types/api';

/**
 * Returns a standardized initial state object for any Redux slice that uses
 * page/limit style pagination.
 *
 * This helper ensures every paginated slice (tables, card lists, reports, etc.)
 * starts with the same structure:
 *   - empty data array
 *   - pagination metadata (page, limit, totals)
 *   - loading + error flags
 *
 * Keeping this definition centralized guarantees consistency across features
 * and avoids duplicated boilerplate in slices.
 *
 * @template T - The type of each item stored in the paginated list.
 * @returns {ReduxPaginatedState<T>} A fully initialized paginated slice state.
 */
export const createInitialPaginatedState = <T>(): ReduxPaginatedState<T> => ({
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalRecords: 0,
  },
  loading: false,
  error: null,
});
