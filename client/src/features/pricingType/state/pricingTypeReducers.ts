import paginatedPricingTypesReducer from './paginatedPricingTypesSlice';
import pricingTypeDetailReducer from './pricingTypeDetailSlice';

/**
 * Reducer map for the Pricing Type feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `pricingType` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details.
 * - Reducer aggregators must NEVER import feature or state
 *   index (barrel) files.
 */
export const pricingTypeReducers = {
  /** Paginated and searchable pricing type list */
  paginatedPricingTypes: paginatedPricingTypesReducer,

  /** Metadata and configuration for a single pricing type */
  pricingTypeDetail: pricingTypeDetailReducer,
};
