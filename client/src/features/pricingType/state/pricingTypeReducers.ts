import pricingTypesReducer from './pricingTypeSlice';
import pricingTypeMetadataReducer from './pricingTypeMetadataSlice';

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
  pricingTypes: pricingTypesReducer,

  /** Metadata and configuration for a single pricing type */
  pricingTypeMetadata: pricingTypeMetadataReducer,
};
