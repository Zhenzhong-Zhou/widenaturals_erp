import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { ProductDetailState } from '@features/product/state/productTypes';

/**
 * Base selector to access the product detail slice from the root Redux state.
 *
 * @param state - The root Redux state.
 * @returns The product detail slice of the Redux store.
 */
const selectProductDetailState = (state: RootState): ProductDetailState =>
  state.product as ProductDetailState;

/**
 * Selector to retrieve the product detail object.
 */
export const selectProductDetail = createSelector(
  selectProductDetailState,
  (state) => state.productDetail
);

/**
 * Selector to retrieve the loading state for product detail.
 */
export const selectProductDetailLoading = createSelector(
  selectProductDetailState,
  (state) => state.loading
);

/**
 * Selector to retrieve the error state for product detail.
 */
export const selectProductDetailError = createSelector(
  selectProductDetailState,
  (state) => state.error
);
