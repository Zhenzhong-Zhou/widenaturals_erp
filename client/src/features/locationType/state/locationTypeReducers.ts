import locationTypesReducer from './locationTypesSlice';
import locationTypeReducer from './locationTypeDetailSlice';

/**
 * Reducer map for the Location Type feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `locationType` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const locationTypeReducers = {
  /** List and pagination of location types */
  locationTypes: locationTypesReducer,

  /** Single location type detail state */
  locationType: locationTypeReducer,
};
