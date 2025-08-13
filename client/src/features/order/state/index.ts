import salesOrderCreationReducer from './salesOrderCreationSlice';
import orderDetailsReducer from './orderDetailsSlice';

export const orderReducers = {
  salesOrderCreation: salesOrderCreationReducer,
  orderDetails: orderDetailsReducer,
};

// Optional exports for thunks, selectors, types
export * from './salesOrderCreationSelectors';
export * from './orderDetailsSelectors';
export * from './orderThunks';
export * from './orderTypes';
