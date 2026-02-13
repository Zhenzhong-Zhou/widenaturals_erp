import paginatedBatchRegistryReducer from './paginatedBatchRegistrySlice';

/**
 * Reducers for the batch registry module.
 *
 * These reducers are composed into the runtime store and
 * manage all batch registry–related state, including:
 * - paginated registry records
 * - loading and error states
 * - pagination metadata
 */
export const batchRegistryReducers = {
  /**
   * Paginated batch registry list state.
   *
   * Contains:
   * - current batch registry records
   * - loading and error flags
   * - pagination metadata
   *
   * Filters and query params are managed externally
   * (e.g. by page controllers or hooks).
   */
  paginatedBatchRegistry: paginatedBatchRegistryReducer,
};
