import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type { CreatedSkuRecord } from '@features/sku/state/skuTypes';

/**
 * Base selector — retrieves the full `createSkus` slice.
 *
 * Useful when you need access to the entire async state object.
 * Typically consumed by more granular selectors.
 *
 * @example
 * const state = useSelector(selectCreateSkusState);
 */
const selectCreateSkusState= createSelector(
  [selectRuntime],
  (runtime) => runtime.createSkus
);

/**
 * Selector: returns the full API response (`CreateSkuResponse`) or null
 * if the request has not succeeded.
 *
 * This is the primary source of truth for:
 *   - created SKU IDs
 *   - created SKU codes
 *   - metadata such as inputCount, createdCount, and elapsedMs
 *
 * @example
 * const response = useSelector(selectCreateSkusData);
 */
export const selectCreateSkusData = createSelector(
  [selectCreateSkusState],
  (state) => state.data
);

/**
 * Selector: indicates whether the create operation is currently in progress.
 *
 * @example
 * const loading = useSelector(selectCreateSkusLoading);
 */
export const selectCreateSkusLoading = createSelector(
  [selectCreateSkusState],
  (state) => state.loading
);

/**
 * Selector: returns the current error message (if any).
 *
 * Useful for showing inline form errors, toast messages, or dialog-level alerts.
 *
 * @example
 * const error = useSelector(selectCreateSkusError);
 */
export const selectCreateSkusError = createSelector(
  [selectCreateSkusState],
  (state) => state.error
);

/**
 * Derived selector: returns `true` if a create operation
 * has successfully completed.
 *
 * This is equivalent to checking `state.data !== null`, but memoized
 * and reusable for consistent UI logic.
 *
 * @example
 * const isSuccess = useSelector(selectCreateSkusSuccess);
 *
 * if (isSuccess) {
 *   console.log("SKU(s) created successfully!");
 * }
 */
export const selectCreateSkusSuccess = createSelector(
  [selectCreateSkusData],
  (data) => !!data
);

/**
 * Derived selector: returns only the SKU codes from the successful response.
 *
 * This is especially useful for:
 *   - confirmation dialogs
 *   - toast notifications
 *   - post-creation summaries ("Created SKUs: ...")
 *
 * Always returns an array—empty if no successful creation occurred.
 *
 * @example
 * const codes = useSelector(selectCreatedSkuCodes);
 * // => ["CJ-IUM500-S-CN"]
 */
export const selectCreatedSkuCodes = createSelector(
  [selectCreateSkusData],
  (data) => data?.data?.map((r: CreatedSkuRecord) => r.skuCode) ?? []
);
