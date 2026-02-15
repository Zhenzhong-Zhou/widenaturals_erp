import paginatedLocationsReducer from './paginatedLocationsSlice';

/* ============================================================
   Location Feature Reducer Map
   ============================================================ */

/**
 * Aggregated reducer map for the Location feature.
 *
 * This object defines the complete state subtree managed by
 * the Location domain and is consumed exclusively by the
 * application root reducer.
 *
 * Architectural boundaries:
 * - Slice reducers are imported locally to prevent circular
 *   module initialization (Temporal Dead Zone) issues.
 * - Individual slice reducers are considered private
 *   implementation details and must NOT be imported
 *   outside this feature boundary.
 * - The root reducer integrates this map under the `location`
 *   namespace to compose the global store.
 *
 * State shape example:
 * {
 *   location: {
 *     paginatedLocations: ReduxPaginatedState<FlattenedLocationRow>
 *   }
 * }
 *
 * Design goals:
 * - Maintain strict feature encapsulation
 * - Enable scalable multi-slice expansion (e.g. details, lookups)
 * - Preserve predictable store structure across ERP modules
 */
export const locationReducers = {
  /** Paginated location list state */
  paginatedLocations: paginatedLocationsReducer,
};
