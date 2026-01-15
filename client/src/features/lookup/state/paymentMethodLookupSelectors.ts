import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  PaymentMethodLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the payment method lookup slice.
 */
const selectPaymentMethodLookupState = (state: RootState) =>
  selectRuntime(state).paymentMethodLookup;

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
export const selectPaymentMethodLookupMeta = createLookupMetaSelector(
  selectPaymentMethodLookupState
);

/**
 * Selector that maps payment method lookup items into dropdown options.
 *
 * Each option includes:
 * - `label` and `value` for use in dropdown UI components (with `value` = method `id`)
 * - `isActive` flag to indicate whether the payment method is currently active
 *
 * Suitable for use in Autocomplete, Select, and other dropdown components
 * where payment method choices are required.
 *
 * @returns An array of {@link LookupOption} objects enriched with status flags.
 */
export const selectPaymentMethodDropdownOptions = createSelector(
  [selectPaymentMethodLookupItems],
  (items: PaymentMethodLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
