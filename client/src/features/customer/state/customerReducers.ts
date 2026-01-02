import customerCreateReducer from './customerCreateSlice';
import paginatedCustomersReducer from './paginatedCustomersSlice';

/**
 * Reducer map for the Customer feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `customer` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for the Customer feature.
 */
export const customerReducers = {
  /** State and workflow for creating a new customer */
  customerCreate: customerCreateReducer,

  /** Paginated customer list, filters, and pagination metadata */
  paginatedCustomers: paginatedCustomersReducer,
};
