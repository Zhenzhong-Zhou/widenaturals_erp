import { createSelector } from 'reselect';
import { RootState } from '../../../store/store.ts';

// Base selector
const selectCustomerDropdownState = (state: RootState) => state.customerDropdown;

// Memoized selectors
export const selectCustomerDropdownData = createSelector(
  selectCustomerDropdownState,
  (customerState) => customerState.data
);

export const selectCustomerDropdownLoading = createSelector(
  selectCustomerDropdownState,
  (customerState) => customerState.loading
);

export const selectCustomerDropdownError = createSelector(
  selectCustomerDropdownState,
  (customerState) => customerState.error
);
