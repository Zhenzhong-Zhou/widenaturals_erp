
import orderTypesDropDownReducer from './orderTypeDropdownSlice';
import createSalesOrderReducer from './createSalesOrderSlice';
import confirmSalesOrderReducer from './confirmSalesOrderSlice';
import ordersReducer from './orderSlice';
import salesOrderDetailReducer from './salesOrderDetailSlice';

export const orderReducers = {
  orderTypesDropdown: orderTypesDropDownReducer,
  createSalesOrder: createSalesOrderReducer,
  confirmSalesOrder: confirmSalesOrderReducer,
  orders: ordersReducer,
  salesOrderDetail: salesOrderDetailReducer,
};

// Optional exports for thunks, selectors, types
export * from './orderThunks';
export * from './orderSelectors';
export * from './orderTypes';