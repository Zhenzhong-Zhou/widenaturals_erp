import type {
  BatchReview,
  PackagingMaterialBatchReview,
  ProductBatchReview,
} from '@features/inventoryAllocation/state';

/**
 * Type guard to check if the batch is a product batch.
 *
 * @param batch - The batch object to check.
 * @returns True if the batch is a ProductBatchReview.
 */
export const isProductBatch = (
  batch: BatchReview
): batch is ProductBatchReview => {
  return batch.type === 'product';
};

/**
 * Type guard to check if the batch is a packaging material batch.
 *
 * @param batch - The batch object to check.
 * @returns True if the batch is a PackagingMaterialBatchReview.
 */
export const isPackagingBatch = (
  batch: BatchReview
): batch is PackagingMaterialBatchReview => {
  return batch.type === 'packaging_material';
};
