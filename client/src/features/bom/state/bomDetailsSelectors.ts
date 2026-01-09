import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/** Base selector to access the BOM details slice state. */
const selectBomDetailsState= createSelector(
  [selectRuntime],
  (runtime) => runtime.bomDetails
);

/** Selects the BOM details data object (header, parts, and summary). */
export const selectBomDetailsData = createSelector(
  [selectBomDetailsState],
  (s) => s.data
);

/** Selects the loading status of the BOM details fetch request. */
export const selectBomDetailsLoading = createSelector(
  [selectBomDetailsState],
  (s) => s.loading
);

/** Selects the error message from the BOM details state (if any). */
export const selectBomDetailsError = createSelector(
  [selectBomDetailsState],
  (s) => s.error
);

/** Returns `true` if BOM details are available and not loading. */
export const selectHasBomDetails = createSelector(
  [selectBomDetailsData, selectBomDetailsLoading],
  (data, loading) => !!data && !loading
);

/** Returns the total part count in the BOM, or 0 if none. */
export const selectBomPartCount = createSelector(
  [selectBomDetailsData],
  (data) => data?.details?.length ?? 0
);

/** Returns the total estimated cost in CAD, or 0 if missing. */
export const selectBomTotalEstimatedCost = createSelector(
  [selectBomDetailsData],
  (data) => data?.summary?.totalEstimatedCost ?? 0
);
