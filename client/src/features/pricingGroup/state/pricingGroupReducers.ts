/**
 * @file pricingGroupReducers.ts
 * @description Aggregated reducer map for the pricing group domain.
 * Registers all pricing group slice reducers for injection into the runtime store.
 */

import paginatedPricingGroupReducer from './paginatedPricingGroupsSlice';

/**
 * Reducer map for the pricing group domain.
 * Spread into the runtime slice's `reducers` field during store construction.
 */
export const pricingGroupReducers = {
  paginatedPricingGroups: paginatedPricingGroupReducer,
};
