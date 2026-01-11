import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type { CreatedProduct } from '@features/product/state/productTypes';

/**
 * Base selector — retrieves the full `createProducts` slice.
 *
 * Useful for accessing the entire async state object.
 *
 * @example
 * const state = useSelector(selectCreateProductsState);
 */
const selectCreateProductsState= createSelector(
  [selectRuntime],
  (runtime) => runtime.createProducts
);

/**
 * Selector: returns the full API response (`CreateProductResponse`) or null.
 *
 * This includes:
 *   - created product IDs
 *   - stats: inputCount, processedCount, elapsedMs
 *
 * @example
 * const response = useSelector(selectCreateProductsData);
 */
export const selectCreateProductsData = createSelector(
  [selectCreateProductsState],
  (state) => state.data
);

/**
 * Selector: indicates whether the product create operation is in progress.
 *
 * @example
 * const loading = useSelector(selectCreateProductsLoading);
 */
export const selectCreateProductsLoading = createSelector(
  [selectCreateProductsState],
  (state) => state.loading
);

/**
 * Selector: returns the current error message (if any).
 *
 * Useful for toast alerts, form errors, dialog error states.
 *
 * @example
 * const error = useSelector(selectCreateProductsError);
 */
export const selectCreateProductsError = createSelector(
  [selectCreateProductsState],
  (state) => state.error
);

/**
 * Derived selector: true if the createProducts request succeeded.
 *
 * Equivalent to checking if `data !== null` but memoized.
 *
 * @example
 * const success = useSelector(selectCreateProductsSuccess);
 */
export const selectCreateProductsSuccess = createSelector(
  [selectCreateProductsData],
  (data) => !!data
);

/**
 * Derived selector: returns only the created product IDs.
 *
 * Useful for:
 *   - confirmation modals
 *   - toast messages
 *   - redirects after creation
 *
 * Always returns an array (empty if not created).
 *
 * @example
 * const ids = useSelector(selectCreatedProductIds);
 * // => ["e030af90-2417-4ef4-9135-8495b80a3ace"]
 */
export const selectCreatedProductIds = createSelector(
  [selectCreateProductsData],
  (data) => data?.data?.map((p: CreatedProduct) => p.id) ?? []
);
