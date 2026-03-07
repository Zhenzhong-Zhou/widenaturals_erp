import skuProductCardsReducer from './skuProductCardsSlice';
import skuDetailReducer from './skuDetailSlice';
import paginatedSkusReducer from './paginatedSkusSlice';
import createSkusReducer from './createSkusSlice';
import skuMetadataReducer from './skuMetadataSlice';
import skuStatusReducer from './skuStatusSlice';
import skuDimensionsReducer from './skuDimensionsSlice';
import skuIdentityReducer from './skuIdentitySlice';

/**
 * Reducer map for the SKU feature module.
 *
 * This object aggregates all Redux slice reducers related to SKU management.
 * It is consumed exclusively by the root reducer to compose the `sku`
 * state subtree within the global application state.
 *
 * Architecture guidelines:
 * - Slice reducers are imported locally to avoid circular ES module
 *   initialization (Temporal Dead Zone) issues.
 * - Reducers remain private implementation details of the SKU module.
 * - Aggregator files must NEVER import from feature or state barrel files.
 * - Each reducer manages a single domain responsibility within the SKU module.
 */
export const skuReducers = {
  /**
   * Product card list used in SKU browsing views.
   * Typically, contains lightweight summary data for grid/list displays.
   */
  skuProductCards: skuProductCardsReducer,

  /**
   * Detailed SKU record used in the SKU detail page.
   * Includes full metadata, pricing, inventory, and related attributes.
   */
  skuDetail: skuDetailReducer,

  /**
   * Paginated SKU list with filtering, sorting, and pagination metadata.
   * Used for administrative SKU management screens.
   */
  paginatedSkus: paginatedSkusReducer,

  /**
   * SKU creation workflow state.
   * Handles creation requests, loading state, and API responses.
   */
  createSkus: createSkusReducer,

  /**
   * SKU metadata update workflow.
   * Handles updates to descriptive attributes such as
   * description, language, size label, and market region.
   */
  skuMetadata: skuMetadataReducer,

  /**
   * SKU status update workflow.
   * Used to transition SKU lifecycle states
   * (e.g. active, archived, discontinued).
   */
  skuStatus: skuStatusReducer,

  /**
   * SKU physical dimensions update workflow.
   * Stores update state for shipping and logistics attributes
   * (length, width, height, weight).
   */
  skuDimensions: skuDimensionsReducer,

  /**
   * SKU identity update workflow.
   * Handles changes to commercial identifiers such as
   * SKU code and barcode values.
   */
  skuIdentity: skuIdentityReducer,
};
