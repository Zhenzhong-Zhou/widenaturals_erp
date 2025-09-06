import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type {
  AllocationReviewItem
} from '@features/inventoryAllocation/state/inventoryAllocationTypes';
import { isPackagingBatch, isProductBatch } from '@utils/batchTypeGuards.ts';

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

/** Item count (stable number for badges, etc.) */
export const selectReviewItemCount = createSelector(
  [selectReviewItems],
  (items) => items.length
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
 * Selector that maps allocation review items into flattened display rows.
 *
 * This supports multiple batch types (product and packaging material),
 * and returns relevant fields (e.g., SKU code, material label, lot number,
 * expiry date, allocated quantity) depending on the batch type.
 *
 * @returns An array of normalized review rows for table rendering.
 * - Product rows include: type, skuCode, displayName, lot, expiryDate, allocated.
 * - Packaging material rows include: type, materialCode, materialLabel, lot, expiryDate, allocated.
 * - Unknown types fallback to type: 'unknown'.
 */
export const selectReviewAllocations = createSelector(
  selectReviewItems,
  (items) =>
    items.map((item: AllocationReviewItem) => {
      const { batch, product, packagingMaterial, allocatedQuantity } = item;
      
      if (isProductBatch(batch)) {
        return {
          type: 'product' as const,
          skuCode: product?.skuCode ?? '—',
          displayName: product?.displayName ?? 'Unnamed Product',
          lot: batch.lotNumber ?? '—',
          expiryDate: batch.expiryDate ?? null,
          allocated: allocatedQuantity,
        };
      }
      
      if (isPackagingBatch(batch)) {
        return {
          type: 'packaging_material' as const,
          materialCode: packagingMaterial?.code ?? '—',
          materialLabel: packagingMaterial?.label ?? 'Unnamed Material',
          lot: batch.lotNumber ?? '—',
          expiryDate: batch.expiryDate ?? null,
          allocated: allocatedQuantity,
        };
      }
      
      return {
        type: 'unknown' as const,
        allocated: allocatedQuantity,
      };
    })
);
