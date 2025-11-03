import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  DeliveryMethodLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes.ts';

/**
 * Base selector for the delivery method lookup slice.
 */
const selectDeliveryMethodLookupState = (state: RootState) =>
  state.deliveryMethodLookup;

/**
 * Selector for retrieving the list of delivery method lookup items.
 */
export const selectDeliveryMethodLookupItems = createSelector(
  [selectDeliveryMethodLookupState],
  (state) => state.data
);

/**
 * Selector for the loading state of the delivery method lookup fetch.
 */
export const selectDeliveryMethodLookupLoading = createSelector(
  [selectDeliveryMethodLookupState],
  (state) => state.loading
);

/**
 * Selector for any error that occurred while fetching delivery method lookup data.
 */
export const selectDeliveryMethodLookupError = createSelector(
  [selectDeliveryMethodLookupState],
  (state) => state.error
);

/**
 * Selects pagination metadata for the delivery method lookup slice.
 * Includes `hasMore`, `limit`, and `offset` used for pagination controls.
 */
export const selectDeliveryMethodLookupMeta = createLookupMetaSelector(
  selectDeliveryMethodLookupState
);

/**
 * Selector that transforms delivery method lookup items into dropdown options.
 *
 * Each option includes:
 * - `label` and `value` for use in dropdown components
 * - `isPickupLocation` flag to indicate if the method represents a pickup location
 * - `isActive` flag to indicate if the delivery method is currently active
 *
 * Used to render delivery method options with additional UI logic
 * such as showing inactive states or highlighting pickup methods.
 */
export const selectDeliveryMethodLookupOptions = createSelector(
  [selectDeliveryMethodLookupItems],
  (items: DeliveryMethodLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isPickupLocation', 'isActive'])
);
