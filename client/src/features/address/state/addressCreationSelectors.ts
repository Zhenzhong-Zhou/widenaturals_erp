import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the address creation slice of state.
 */
const selectAddressCreationState= createSelector(
  [selectRuntime],
  (runtime) => runtime.addressCreation
);

/**
 * Selects the loading state for address creation.
 */
export const selectAddressCreationLoading = createSelector(
  [selectAddressCreationState],
  (state) => state.loading
);

/**
 * Selects the error message (if any) from address creation.
 */
export const selectAddressCreationError = createSelector(
  [selectAddressCreationState],
  (state) => state.error
);

/**
 * Selects the created address data (array of address records).
 */
export const selectAddressCreationData = createSelector(
  [selectAddressCreationState],
  (state) => state.data
);

/**
 * Selects the success flag and message from address creation.
 */
export const selectAddressCreationSuccessMessage = createSelector(
  [selectAddressCreationState],
  (state) => ({
    success: state.success,
    message: state.message,
  })
);
