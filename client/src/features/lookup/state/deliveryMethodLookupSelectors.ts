import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { createLookupMetaSelector, mapLookupItems } from '../utils/lookupSelectorUtils';
import type { DeliveryMethodLookupItem, LookupOption } from '@features/lookup/state/lookupTypes.ts';

/**
 * Base selector for the delivery method lookup slice.
 */
const selectDeliveryMethodLookupState = (state: RootState) => state.deliveryMethodLookup;

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
 * Selector that maps delivery method lookup items to dropdown options,
 * including `label`, `value`, and `isPickupLocation` flags.
 *
 * Used to render delivery method options with additional logic
 * based on whether the method is a pickup location.
 */
export const selectDeliveryMethodLookupOptions = createSelector(
  [selectDeliveryMethodLookupItems],
  (items: DeliveryMethodLookupItem[]): LookupOption[] => mapLookupItems(items, ['isPickupLocation'])
);
