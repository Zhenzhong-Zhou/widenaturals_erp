import createSalesOrderReducer from './createSalesOrderSlice';
import confirmSalesOrderReducer from './confirmSalesOrderSlice';
import allOrdersReducer from '@features/order/state/allOrderSlice';
import salesOrderDetailReducer from './salesOrderDetailSlice';
import allocationEligibleOrderReducer from '@features/order/state/allocationEligibleOrdersSlice.ts';
import allocationEligibleOrderDetailsReducer from '@features/order/state/allocationEligibleOrderDetailsSlice.ts';

export const orderReducers = {
  createSalesOrder: createSalesOrderReducer,
  confirmSalesOrder: confirmSalesOrderReducer,
  allOrders: allOrdersReducer,
  allocationEligibleOrders: allocationEligibleOrderReducer,
  salesOrderDetail: salesOrderDetailReducer,
  allocationEligibleOrderDetails: allocationEligibleOrderDetailsReducer,
};

// Optional exports for thunks, selectors, types
export * from './orderThunks';
export * from './allOrderSelectors';
export * from './orderTypes';
