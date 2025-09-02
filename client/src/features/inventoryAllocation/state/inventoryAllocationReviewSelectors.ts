import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { AllocationReviewItem } from '@features/inventoryAllocation/state/inventoryAllocationTypes';

/**
 * Root selector for the inventory allocation review slice.
 */
const selectInventoryAllocationReviewState = (state: RootState) =>
  state.inventoryAllocationReview;

/* =======================
   Primitive field selectors
   ======================= */

/**
 * Selector for loading state of inventory allocation review.
 */
export const selectReviewLoading = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.loading
);

/**
 * Selector for error message (if any).
 */
export const selectReviewError = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.error
);

/**
 * Selector for human-readable message from the server.
 */
export const selectReviewMessage = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.message
);

/**
 * Selector for the last successful fetch timestamp.
 */
export const selectReviewLastFetchedAt = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.lastFetchedAt
);

/**
 * Selector for the raw API response data.
 */
export const selectReviewData = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.data
);

/* =======================
   Derived selectors
   ======================= */

/**
 * Selector for order header details.
 */
export const selectReviewHeader = createSelector(
  selectReviewData,
  (data) => data?.header ?? null
);

/**
 * Selector for list of allocation review items.
 */
export const selectReviewItems = createSelector(
  selectReviewData,
  (data) => data?.items ?? []
);

/**
 * Selector for the name of the salesperson or creator.
 */
export const selectReviewCreatedBy = createSelector(
  selectReviewHeader,
  (header) => header?.salesperson?.fullName ?? '—'
);

/**
 * Selector for the list of allocation IDs present in the review.
 */
export const selectReviewAllocationIds = createSelector(
  selectReviewItems,
  (items) => items.map((item: AllocationReviewItem) => item.allocationId)
);

/**
 * Selector that transforms each review item into a product row for display.
 */
export const selectReviewProducts = createSelector(
  selectReviewItems,
  (items) =>
    items.map((item: AllocationReviewItem) => ({
      skuCode: item.product.skuCode,
      displayName: item.product.displayName,
      lot: item.batch.productLotNumber,
      allocated: item.allocatedQuantity,
    }))
);
