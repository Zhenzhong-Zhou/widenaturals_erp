import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';
import { DeliveryMethodDropdownItem } from './deliveryMethodTypes';

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
      label: `${method.name} (${method.estimatedTime.days} days)`
    }))
);
