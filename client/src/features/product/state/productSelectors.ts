import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Simple selectors to access state slices
const selectProductsState = (state: RootState) => state.products;

// Memoized selector for product data
export const selectProducts = createSelector(
  [selectProductsState],
  (productsState) => productsState.data
);

// Memoized selector for pagination
export const selectProductsPagination = createSelector(
  [selectProductsState],
  (productsState) => productsState.pagination
);

// Memoized selector for loading state
export const selectProductsLoading = createSelector(
  [selectProductsState],
  (productsState) => productsState.loading
);

// Memoized selector for error state
export const selectProductsError = createSelector(
  [selectProductsState],
  (productsState) => productsState.error
);
