import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

const selectSkuProductCardState = (state: RootState) => state.skuProductCards;

// Memoized selector: select only the transformed product card data
export const selectSkuProductCards = createSelector(
  [selectSkuProductCardState],
  (skuProductCardState) => skuProductCardState.data
);

// Memoized selector: select pagination
export const selectSkuProductPagination = createSelector(
  [selectSkuProductCardState],
  (skuProductCardState) => skuProductCardState.pagination
);

// Memoized selector: loading state
export const selectSkuProductLoading = createSelector(
  [selectSkuProductCardState],
  (skuProductCardState) => skuProductCardState.loading
);

// Memoized selector: error state
export const selectSkuProductError = createSelector(
  selectSkuProductCardState,
  (state) => state.error
);
