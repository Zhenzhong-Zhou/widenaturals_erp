import salesOrderCreationReducer from './salesOrderCreationSlice';
import paginatedOrdersReducer from './paginatedOrdersSlice';
import orderDetailsReducer from './orderDetailsSlice';
import updateOrderStatusReducer from './updateOrderStatusSlice';

export const orderReducers = {
  salesOrderCreation: salesOrderCreationReducer,
  paginatedOrders: paginatedOrdersReducer,
  orderDetails: orderDetailsReducer,
  updateOrderStatus: updateOrderStatusReducer,
};

// Optional exports for thunks, selectors, types
export * from './salesOrderCreationSelectors';
export * from './paginatedOrdersSelectors';
export * from './orderDetailsSelectors';
export * from './updateOrderStatusSelectors';
export * from './orderThunks';
export * from './orderTypes';
