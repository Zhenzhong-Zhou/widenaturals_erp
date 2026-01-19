import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { AllocationReviewItem } from '@features/inventoryAllocation/state/inventoryAllocationTypes';
import { isPackagingBatch, isProductBatch } from '@utils/batchTypeGuards';

/**
 * Base selector for the inventory allocation review state slice.
 *
 * Responsibilities:
 * - Extract the inventory allocation review state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectInventoryAllocationReviewState = (state: RootState) =>
  selectRuntime(state).inventoryAllocationReview;

/* =======================
   Primitive field selectors
   ======================= */

/**
 * Selects whether the inventory allocation review request is loading.
 */
export const selectReviewLoading = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.loading
);

/**
 * Selects any error message from the inventory allocation review request.
 */
export const selectReviewError = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.error
);

/**
 * Selects the human-readable message returned by the server.
 */
export const selectReviewMessage = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.message
);

/**
 * Selects the timestamp of the last successful review fetch.
 */
export const selectReviewLastFetchedAt = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.lastFetchedAt
);

/**
 * Selects the raw inventory allocation review response data.
 */
export const selectReviewData = createSelector(
  selectInventoryAllocationReviewState,
  (state) => state.data
);

/* =======================
   Derived selectors
   ======================= */

/**
 * Selects the order header details from the review response.
 */
export const selectReviewHeader = createSelector(
  selectReviewData,
  (data) => data?.header ?? null
);

/**
 * Selects the list of allocation review items.
 */
export const selectReviewItems = createSelector(
  selectReviewData,
  (data) => data?.items ?? []
);

/**
 * Selects the total number of allocation review items.
 */
export const selectReviewItemCount = createSelector(
  [selectReviewItems],
  (items) => items.length
);

/**
 * Selects the name of the salesperson or creator associated with the order.
 */
export const selectReviewCreatedBy = createSelector(
  selectReviewHeader,
  (header) => header?.salesperson?.fullName ?? '—'
);

/**
 * Selects the list of allocation IDs present in the review.
 */
export const selectReviewAllocationIds = createSelector(
  selectReviewItems,
  (items) => items.map((item: AllocationReviewItem) => item.allocationId)
);

/**
 * Maps allocation review items into flattened, display-ready rows.
 *
 * Supports both product batches and packaging material batches,
 * normalizing their fields for table rendering.
 *
 * Returns:
 * - Product rows: type, skuCode, displayName, lot, expiryDate, allocated
 * - Packaging rows: type, materialCode, materialLabel, lot, expiryDate, allocated
 * - Unknown rows: type = 'unknown', allocated
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
