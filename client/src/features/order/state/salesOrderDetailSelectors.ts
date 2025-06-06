import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { OrderDetailsResponse } from '@features/order';

// Base Selector - Getting the whole salesOrderDetails state slice
const selectSalesOrderDetailsState = (state: RootState) =>
  state.salesOrderDetail;

// Memoized Selector for getting the sales order details data
export const selectSalesOrderDetailsData = createSelector(
  [selectSalesOrderDetailsState],
  (salesOrderDetails) => salesOrderDetails.data
);

// Memoized Selector for fetching loading state
export const selectSalesOrderDetailsLoading = createSelector(
  [selectSalesOrderDetailsState],
  (salesOrderDetails) => salesOrderDetails.loading
);

// Memoized Selector for fetching error state
export const selectSalesOrderDetailsError = createSelector(
  [selectSalesOrderDetailsState],
  (salesOrderDetails) => salesOrderDetails.error
);

// Example of fetching a specific value from the data (Order Number)
export const selectOrderNumber = createSelector(
  [selectSalesOrderDetailsData],
  (data: OrderDetailsResponse | null) => data?.data.order_number || null
);
