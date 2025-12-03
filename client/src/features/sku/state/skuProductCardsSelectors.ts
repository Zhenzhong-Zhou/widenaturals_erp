import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { mapSkuProductCardToViewItem } from '@features/sku/utils/skuProductCardUtils';

/**
 * ---------------------------------------------------------------------
 * Base Selector
 * ---------------------------------------------------------------------
 * Returns the entire SKU Product Cards slice.
 * Used as the root selector for all derived selectors below.
 */
export const selectSkuProductCardsState = (state: RootState) =>
  state.skuProductCards;

/**
 * ---------------------------------------------------------------------
 * Raw Slice Fields
 * ---------------------------------------------------------------------
 */

/**
 * Selects the raw array of `SkuProductCard` items from state.
 */
export const selectSkuProductCardData = createSelector(
  [selectSkuProductCardsState],
  (slice) => slice.data
);

/**
 * Selects pagination metadata (page, limit, totalRecords, totalPages).
 */
export const selectSkuProductCardPagination = createSelector(
  [selectSkuProductCardsState],
  (slice) => slice.pagination
);

/**
 * Selects loading flag for SKU product card requests.
 */
export const selectSkuProductCardLoading = createSelector(
  [selectSkuProductCardsState],
  (slice) => slice.loading
);

/**
 * Selects the latest error message (if any).
 */
export const selectSkuProductCardError = createSelector(
  [selectSkuProductCardsState],
  (slice) => slice.error
);

/**
 * ---------------------------------------------------------------------
 * Derived Selectors (Memoized)
 * ---------------------------------------------------------------------
 */

/**
 * Returns true when:
 *   - There is no active request (`!loading`)
 *   - No SKU product cards exist (`data.length === 0`)
 *
 * Useful for showing UI placeholders like “No results”.
 */
export const selectSkuProductCardsIsEmpty = createSelector(
  [selectSkuProductCardData, selectSkuProductCardLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selects all SKU Product Cards from the store and transforms them into
 * UI-optimized `SkuProductCardViewItem` objects.
 *
 * This memoized selector ensures:
 *  - consistent UI shape across all catalog/grid components
 *  - centralized transformation logic (via `mapSkuProductCardToViewItem`)
 *  - no repeated mapping inside components, improving performance
 *
 * Ideal for: product catalog pages, search results, previews, and anywhere
 * a flattened, display-friendly view of SKU product data is required.
 */
export const selectSkuProductCardViewItems = createSelector(
  [selectSkuProductCardData],
  (cards) => cards.map(mapSkuProductCardToViewItem)
);
