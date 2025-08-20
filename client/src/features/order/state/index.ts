import salesOrderCreationReducer from './salesOrderCreationSlice';
import orderDetailsReducer from './orderDetailsSlice';
import updateOrderStatusReducer from './updateOrderStatusSlice';

export const orderReducers = {
  salesOrderCreation: salesOrderCreationReducer,
  orderDetails: orderDetailsReducer,
  updateOrderStatus: updateOrderStatusReducer,
};

// Optional exports for thunks, selectors, types
export * from './salesOrderCreationSelectors';
export * from './orderDetailsSelectors';
export * from './updateOrderStatusSelectors';
export * from './orderThunks';
export * from './orderTypes';
