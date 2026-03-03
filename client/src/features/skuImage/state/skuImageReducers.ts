import skuImageUploadReducer from './skuImageUploadSlice';
import skuImageUpdateReducer from './skuImageUpdateSlice';

/**
 * SKU Image Feature Reducer Aggregator
 *
 * Purpose:
 * - Groups all SKU image–related slice reducers into a single object.
 * - Consumed exclusively by the root reducer to compose the `skuImage`
 *   subtree of the global Redux store.
 *
 * Architectural Constraints:
 * - Must import slice reducers directly (never through barrel files).
 * - Must NOT import feature index files to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Acts as a boundary layer between feature slices and store composition.
 *
 * Design Intent:
 * - Keep slice reducers private implementation details.
 * - Provide a stable reducer contract for store integration.
 */
export const skuImageReducers = {
  /** Handles bulk upload lifecycle and results */
  skuImageUpload: skuImageUploadReducer,
  
  /** Handles bulk update lifecycle and results */
  skuImageUpdate: skuImageUpdateReducer,
};
