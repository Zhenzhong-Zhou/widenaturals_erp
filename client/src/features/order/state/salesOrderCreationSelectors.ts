import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Root selector for accessing the sales order creation slice of the Redux state.
 */
const selectSalesOrderCreationState = (state: RootState) =>
  state.salesOrderCreation;

/**
 * Selector for checking if a sales order is currently being created.
 *
 * @returns `true` if the request is in progress, otherwise `false`.
 */
export const selectSalesOrderCreationLoading = createSelector(
  [selectSalesOrderCreationState],
  (state) => state.loading
);

/**
 * Selector for retrieving any error that occurred during sales order creation.
 *
 * @returns A string error message if an error occurred, otherwise `null`.
 */
export const selectSalesOrderCreationError = createSelector(
  [selectSalesOrderCreationState],
  (state) => state.error
);

/**
 * Selector for retrieving the ID of the newly created sales order.
 *
 * @returns The order ID string if creation succeeded, otherwise `null`.
 */
export const selectCreatedSalesOrderId = createSelector(
  [selectSalesOrderCreationState],
  (state) => state.data?.orderId ?? null
);

/**
 * Selector for retrieving the full sales order creation response data.
 *
 * @returns An object containing `orderId`, or `null` if not created yet.
 */
export const selectSalesOrderCreationData = createSelector(
  [selectSalesOrderCreationState],
  (state) => state.data
);
