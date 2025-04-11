import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { DeliveryMethodDropdownItem } from './deliveryMethodTypes';

// Selector to get the delivery method state
const selectDeliveryMethodDropdownState = (state: RootState) => state.deliveryMethodDropdown;

// Selector to get the list of methods
export const selectDeliveryMethods = createSelector(
  [selectDeliveryMethodDropdownState],
  (deliveryMethodState) => deliveryMethodState.methods
);

// Selector to get loading state
export const selectDeliveryMethodDropdownLoading = createSelector(
  [selectDeliveryMethodDropdownState],
  (deliveryMethodState) => deliveryMethodState.loading
);

// Selector to get error state
export const selectDeliveryMethodDropdownError = createSelector(
  [selectDeliveryMethodDropdownState],
  (deliveryMethodState) => deliveryMethodState.error
);

// Memoized Selector to get formatted delivery methods for Dropdown
export const selectFormattedDeliveryMethodDropdown = createSelector(
  [selectDeliveryMethods],
  (methods: DeliveryMethodDropdownItem[]) =>
    methods.map(method => ({
      value: method.id,
      label: method.estimatedTime
        ? `${method.name} (${method.estimatedTime.days} days)` // Display days if available
        : method.name // Display name only if estimatedTime is null
    }))
);
