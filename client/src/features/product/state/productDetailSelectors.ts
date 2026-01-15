import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the Product detail slice.
 * Extracts the entire `productDetail` state from Redux.
 */
const selectProductDetailState = (state: RootState) =>
  selectRuntime(state).productDetail;

/**
 * Selector: Returns the Product detail object (`ProductResponse | null`).
 */
export const selectProductDetailData = createSelector(
  [selectProductDetailState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the Product detail request is currently loading.
 */
export const selectProductDetailLoading = createSelector(
  [selectProductDetailState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the Product detail state, if any.
 */
export const selectProductDetailError = createSelector(
  [selectProductDetailState],
  (state) => state.error
);

/**
 * Selector: True only if not loading AND product detail is explicitly `null`.
 * Useful for handling "no such product" cases.
 */
export const selectProductDetailIsEmpty = createSelector(
  [selectProductDetailData, selectProductDetailLoading],
  (data, loading) => !loading && data === null
);
