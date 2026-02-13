import paginatedProductBatchesReducer from './paginatedProductBatchesSlice';

/**
 * Product batch reducers.
 *
 * Aggregates all Redux reducers related to the
 * product batch domain.
 *
 * This object is intended to be spread into the
 * runtime reducer map during store configuration.
 *
 * Example usage:
 * ```
 * combineReducers({
 *   ...productBatchReducers,
 *   ...otherFeatureReducers,
 * })
 * ```
 */
export const productBatchReducers = {
  /**
   * Paginated product batch list state.
   *
   * Manages:
   * - flattened product batch records
   * - pagination metadata
   * - loading and error state
   */
  paginatedProductBatches: paginatedProductBatchesReducer,
};
