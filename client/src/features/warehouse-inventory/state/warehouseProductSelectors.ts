import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Direct state selectors
export const selectWarehouseProductSummaryState = (state: RootState) =>
  state.warehouseProducts;
export const selectWarehouseProductLoading = (state: RootState) =>
  state.warehouseProducts.loading;
export const selectWarehouseProductError = (state: RootState) =>
  state.warehouseProducts.error;
export const selectWarehouseProductPagination = (state: RootState) =>
  state.warehouseProducts.pagination;

// Optimized selector for product summary data
export const selectWarehouseProductSummary = createSelector(
  [selectWarehouseProductSummaryState],
  (warehouseProduct) => warehouseProduct.productSummaryData
);
