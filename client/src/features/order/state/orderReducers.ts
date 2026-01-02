import salesOrderCreationReducer from './salesOrderCreationSlice';
import paginatedOrdersReducer from './paginatedOrdersSlice';
import orderDetailsReducer from './orderDetailsSlice';
import updateOrderStatusReducer from './updateOrderStatusSlice';

/**
 * Reducer map for the Order feature.
 *
 * This reducer group is consumed exclusively by the root reducer
 * to compose the `order` state subtree.
 *
 * Design principles:
 * - Slice reducers are imported locally to avoid circular
 *   ES module initialization (TDZ) issues.
 * - Slice reducers are private implementation details and
 *   must not be imported via feature or state index files.
 * - Only this reducer map is exposed as the public store
 *   integration point for order workflows.
 */
export const orderReducers = {
  /** Sales order creation and editing workflow */
  salesOrderCreation: salesOrderCreationReducer,

  /** Paginated order list, filters, and pagination metadata */
  paginatedOrders: paginatedOrdersReducer,

  /** Order detail view including items and metadata */
  orderDetails: orderDetailsReducer,

  /** Order status update workflow */
  updateOrderStatus: updateOrderStatusReducer,
};
