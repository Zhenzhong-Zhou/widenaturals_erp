import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector for the payment method lookup slice.
 */
const selectPaymentMethodLookupState = (state: RootState) => state.paymentMethodLookup;

/**
 * Selector for the list of lookup options to display in dropdowns.
 */
export const selectPaymentMethodOptions = createSelector(
  selectPaymentMethodLookupState,
  (state) => state.data
);

/**
 * Selector for the loading state of the payment method lookup request.
 */
export const selectPaymentMethodLoading = createSelector(
  selectPaymentMethodLookupState,
  (state) => state.loading
);

/**
 * Selector for the error message from the payment method lookup request.
 */
export const selectPaymentMethodError = createSelector(
  selectPaymentMethodLookupState,
  (state) => state.error
);

/**
 * Selector indicating whether more payment method results are available.
 */
export const selectPaymentMethodHasMore = createSelector(
  selectPaymentMethodLookupState,
  (state) => state.hasMore
);

/**
 * Selector for the current offset value (used in pagination).
 */
export const selectPaymentMethodOffset = createSelector(
  selectPaymentMethodLookupState,
  (state) => state.offset
);
