import skuImageUploadReducer from './skuImageUploadSlice';

/**
 * Reducer map for the SKU Image feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `skuImage` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const skuImageReducers = {
  /** SKU image upload and processing workflow */
  skuImageUpload: skuImageUploadReducer,
};
