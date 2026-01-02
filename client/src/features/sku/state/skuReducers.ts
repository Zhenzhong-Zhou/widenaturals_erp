import skuProductCardsReducer from './skuProductCardsSlice';
import skuDetailReducer from './skuDetailSlice';
import paginatedSkusReducer from './paginatedSkusSlice';
import createSkusReducer from './createSkusSlice';
import skuStatusReducer from './skuStatusSlice';

/**
 * Reducer map for the SKU feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `sku` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const skuReducers = {
  /** SKU product card list and summary data */
  skuProductCards: skuProductCardsReducer,

  /** SKU detail view and metadata */
  skuDetail: skuDetailReducer,

  /** Paginated SKU list with filters and pagination metadata */
  paginatedSkus: paginatedSkusReducer,

  /** SKU creation workflow */
  createSkus: createSkusReducer,

  /** SKU status update workflow */
  skuStatus: skuStatusReducer,
};
