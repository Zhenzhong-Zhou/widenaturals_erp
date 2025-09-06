import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  transformIdLabel
} from '../utils/lookupSelectorUtils';
import type {
  PaymentMethodLookupItem,
  LookupOption
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the payment method lookup slice.
 */
const selectPaymentMethodLookupState = (state: RootState) => state.paymentMethodLookup;

/**
 * Selector for retrieving the list of payment method lookup items.
 */
export const selectPaymentMethodLookupItems = createSelector(
  [selectPaymentMethodLookupState],
  (state) => state.data
);

/**
 * Selector for the loading state of the payment method lookup fetch.
 */
export const selectPaymentMethodLookupLoading = createSelector(
  [selectPaymentMethodLookupState],
  (state) => state.loading
);

/**
 * Selector for any error that occurred while fetching payment method lookup data.
 */
export const selectPaymentMethodLookupError = createSelector(
  [selectPaymentMethodLookupState],
  (state) => state.error
);

/**
 * Selects pagination metadata for the payment method lookup slice.
 * Includes `hasMore`, `limit`, and `offset` used for pagination controls.
 */
export const selectPaymentMethodLookupMeta = createLookupMetaSelector(selectPaymentMethodLookupState);

/**
 * Selector that maps payment method lookup items to dropdown options
 * with `{ label, value }`, where `value` is the item `id`.
 * Suitable for use in Autocomplete, Select, etc.
 */
export const selectPaymentMethodDropdownOptions = createSelector(
  [selectPaymentMethodLookupItems],
  (items: PaymentMethodLookupItem[]): LookupOption[] => transformIdLabel(items)
);
