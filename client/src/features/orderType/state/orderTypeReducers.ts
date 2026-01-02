import paginatedOrderTypesReducer from './paginatedOrderTypesSlice';

/**
 * Reducer map for the Order Type feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `orderType` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const orderTypeReducers = {
  /** Paginated order type list and metadata */
  paginatedOrderTypes: paginatedOrderTypesReducer,
};
