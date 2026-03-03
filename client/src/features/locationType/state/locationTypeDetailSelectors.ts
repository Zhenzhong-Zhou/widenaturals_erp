import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the Location Type detail slice.
 * Extracts the entire `locationTypeDetail` state from Redux.
 */
const selectLocationTypeDetailState = (state: RootState) =>
  selectRuntime(state).locationTypeDetail;

/**
 * Selector: Returns the Location Type detail object
 * (`FlattenedLocationTypeDetails | null`).
 */
export const selectLocationTypeDetailData = createSelector(
  [selectLocationTypeDetailState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the Location Type detail
 * request is currently loading.
 */
export const selectLocationTypeDetailLoading = createSelector(
  [selectLocationTypeDetailState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the
 * Location Type detail state, if any.
 */
export const selectLocationTypeDetailError = createSelector(
  [selectLocationTypeDetailState],
  (state): string | null =>
    state.error?.message ?? null
);

/**
 * Selector: True only if not loading AND
 * location type detail is explicitly `null`.
 *
 * Useful for handling "not found" cases.
 */
export const selectLocationTypeDetailIsEmpty = createSelector(
  [selectLocationTypeDetailData, selectLocationTypeDetailLoading],
  (data, loading) => !loading && data === null
);
