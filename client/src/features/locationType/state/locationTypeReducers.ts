import paginatedLocationTypesReducer from './paginatedLocationTypesSlice';
import locationTypeDetailReducer from './locationTypeDetailSlice';

/**
 * Location Type Feature Reducers
 *
 * Aggregates all slice reducers belonging to the Location Type feature.
 *
 * Purpose:
 * - Provides a stable reducer map for composition inside the root reducer
 * - Defines the `locationType` state subtree boundary
 *
 * Architectural Rules:
 * - Slice reducers are imported locally to avoid circular ES module
 *   initialization (TDZ) issues
 * - Slice reducers are private implementation details of this feature
 * - Reducer aggregators MUST NOT import feature-level barrel files
 * - Root reducer is the only consumer of this reducer map
 *
 * State Structure (within runtime subtree):
 * runtime.locationType.paginatedLocationTypes
 */
export const locationTypeReducers = {
  /**
   * Paginated list state for location types
   */
  paginatedLocationTypes: paginatedLocationTypesReducer,
  
  /**
   * Detail state for a single Location Type.
   */
  locationTypeDetail: locationTypeDetailReducer,
};
