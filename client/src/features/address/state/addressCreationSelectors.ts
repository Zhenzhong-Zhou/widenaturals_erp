import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the address creation state slice.
 *
 * Responsibilities:
 * - Extract the address creation slice from the Redux state tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectAddressCreationState = (state: RootState) =>
  selectRuntime(state).addressCreation;

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
 * Selects the address creation result metadata.
 *
 * Returns:
 * - success: boolean
 * - message: string | null
 */
export const selectAddressCreationSuccessMessage = createSelector(
  [selectAddressCreationState],
  (state) => ({
    success: state.success,
    message: state.message,
  })
);
