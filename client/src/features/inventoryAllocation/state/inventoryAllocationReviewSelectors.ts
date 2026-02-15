import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type {
  FlattenedAllocationReviewItem,
  FlattenedAllocationOrderHeader,
} from '@features/inventoryAllocation/state';

/**
 * Root selector for the inventory allocation review runtime slice.
 *
 * NOTE:
 * - This selector exposes raw slice state only.
 * - No data normalization or domain assumptions are applied here.
 */
const selectInventoryAllocationReviewState = (state: RootState) =>
  selectRuntime(state).inventoryAllocationReview;

/* =======================
   Primitive selectors
   ======================= */

export const selectReviewLoading = createSelector(
  [selectInventoryAllocationReviewState],
  (state) => state.loading
);

export const selectReviewError = createSelector(
  [selectInventoryAllocationReviewState],
  (state) => state.error
);

export const selectReviewMessage = createSelector(
  [selectInventoryAllocationReviewState],
  (state) => state.message
);

export const selectReviewLastFetchedAt = createSelector(
  [selectInventoryAllocationReviewState],
  (state) => state.lastFetchedAt
);

export const selectReviewData = createSelector(
  [selectInventoryAllocationReviewState],
  (state) => state.data
);

/* =======================
   Derived selectors
   ======================= */

/**
 * Returns the flattened order header for the allocation review.
 *
 * Falls back to `null` when review data is unavailable.
 */
export const selectReviewHeader = createSelector(
  [selectReviewData],
  (data): FlattenedAllocationOrderHeader | null => data?.header ?? null
);

/**
 * Returns flattened allocation items for the review.
 *
 * Always returns an array to simplify UI consumption.
 */
export const selectReviewItems = createSelector(
  [selectReviewData],
  (data): FlattenedAllocationReviewItem[] => data?.items ?? []
);

export const selectReviewItemCount = createSelector(
  [selectReviewItems],
  (items) => items.length
);

export const selectReviewCreatedBy = createSelector(
  [selectReviewHeader],
  (header) => header?.salespersonName ?? '—'
);

export const selectReviewAllocationIds = createSelector(
  [selectReviewItems],
  (items) => items.map((item) => item.allocationId)
);

/**
 * UI-ready allocation rows for display.
 *
 * Characteristics:
 * - Derived strictly from flattened backend fields
 * - No domain validation, status resolution, or business rules
 * - Safe defaults applied for missing display fields
 *
 * This selector is presentation-focused and should remain logic-light.
 */
export const selectReviewAllocations = createSelector(
  [selectReviewItems],
  (items) =>
    items.map((item) => {
      if (item.batchType === 'product') {
        return {
          type: 'product' as const,
          skuCode: item.skuCode ?? '—',
          displayName: item.productName ?? 'Unnamed Product',
          lot: item.batchLotNumber ?? '—',
          expiryDate: item.batchExpiryDate ?? null,
          allocated: item.allocatedQuantity,
        };
      }

      if (item.batchType === 'packaging_material') {
        return {
          type: 'packaging_material' as const,
          materialCode: item.packagingMaterialCode ?? '—',
          materialLabel: item.packagingMaterialLabel ?? 'Unnamed Material',
          lot: item.batchLotNumber ?? '—',
          expiryDate: item.batchExpiryDate ?? null,
          allocated: item.allocatedQuantity,
        };
      }

      return {
        type: 'unknown' as const,
        allocated: item.allocatedQuantity,
      };
    })
);
