import paginatedPackagingMaterialBatchesReducer
  from './paginatedPackagingMaterialBatchesSlice';

/**
 * Packaging material batch reducers.
 *
 * Aggregates all Redux reducers related to the
 * packaging material batch domain.
 *
 * This object is intended to be spread into the
 * runtime reducer map during store configuration.
 *
 * Example usage:
 * ```
 * combineReducers({
 *   ...packagingMaterialBatchReducers,
 *   ...otherFeatureReducers,
 * })
 * ```
 */
export const packagingMaterialBatchReducers = {
  /**
   * Paginated packaging material batch list state.
   *
   * Manages:
   * - flattened packaging material batch records
   * - pagination metadata
   * - loading and error state
   */
  paginatedPackagingMaterialBatches:
  paginatedPackagingMaterialBatchesReducer,
};
