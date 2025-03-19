import { createSelector } from 'reselect';
import { RootState } from '../../../store/store.ts';

// Base selector for createdSalesOrder state
const selectCreatedSalesOrderState = (state: RootState) => state.createSalesOrder;

// Memoized selector for loading status
export const selectCreatedSalesOrderLoading = createSelector(
  selectCreatedSalesOrderState,
  (createdSalesOrder) => createdSalesOrder.loading
);

// Memoized selector for success status
export const selectCreatedSalesOrderSuccess = createSelector(
  selectCreatedSalesOrderState,
  (createdSalesOrder) => createdSalesOrder.success
);

// Memoized selector for the created sales order ID
export const selectCreatedSalesOrderId = createSelector(
  selectCreatedSalesOrderState,
  (createdSalesOrder) => createdSalesOrder.salesOrderId
);

// Memoized selector for any error message
export const selectCreatedSalesOrderError = createSelector(
  selectCreatedSalesOrderState,
  (createdSalesOrder) => createdSalesOrder.error
);
