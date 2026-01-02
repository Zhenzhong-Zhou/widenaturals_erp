import pricingListReducer from './pricingListSlice';
import pricingListByTypeReducer from './pricingListByTypeSlice';

/**
 * Reducer map for the Pricing feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `pricing` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for pricing-related workflows.
 */
export const pricingReducers = {
  /** Paginated pricing list and base pricing data */
  pricingList: pricingListReducer,

  /** Pricing list grouped and filtered by pricing type */
  pricingListByType: pricingListByTypeReducer,
};
