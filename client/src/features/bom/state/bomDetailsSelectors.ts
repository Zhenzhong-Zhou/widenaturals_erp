import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the BOM details state slice.
 *
 * Responsibilities:
 * - Extract the BOM details state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectBomDetailsState = (state: RootState) =>
  selectRuntime(state).bomDetails;

/**
 * Selects the BOM details data object.
 *
 * Includes:
 * - header
 * - parts / details
 * - summary
 */
export const selectBomDetailsData = createSelector(
  [selectBomDetailsState],
  (state) => state.data
);

/**
 * Selects whether the BOM details fetch request is currently loading.
 */
export const selectBomDetailsLoading = createSelector(
  [selectBomDetailsState],
  (state) => state.loading
);

/**
 * Selects any error message from the BOM details state.
 */
export const selectBomDetailsError = createSelector(
  [selectBomDetailsState],
  (state) => state.error
);

/**
 * Returns true when BOM details are available and not loading.
 */
export const selectHasBomDetails = createSelector(
  [selectBomDetailsData, selectBomDetailsLoading],
  (data, loading) => Boolean(data) && !loading
);

/**
 * Returns the total number of parts in the BOM.
 *
 * Defaults to 0 when details are not available.
 */
export const selectBomPartCount = createSelector(
  [selectBomDetailsData],
  (data) => data?.details?.length ?? 0
);

/**
 * Returns the total estimated BOM cost in CAD.
 *
 * Defaults to 0 when summary data is missing.
 */
export const selectBomTotalEstimatedCost = createSelector(
  [selectBomDetailsData],
  (data) => data?.summary?.totalEstimatedCost ?? 0
);
