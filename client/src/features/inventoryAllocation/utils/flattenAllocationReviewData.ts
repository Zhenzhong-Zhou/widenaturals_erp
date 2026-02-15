import type {
  AllocationReviewItem,
  BatchReview,
  FlattenedAllocationOrderHeader,
  FlattenedAllocationReviewItem,
  OrderHeaderReview,
} from '@features/inventoryAllocation';
import { isPackagingBatch, isProductBatch } from '@utils/batchTypeGuards';

/**
 * Flattens the allocation order header into a UI-safe structure.
 *
 * - Extracts normalized status fields
 * - Resolves salesperson identity
 * - Removes nested domain objects
 */
export const flattenAllocationOrderHeader = (
  header: OrderHeaderReview
): FlattenedAllocationOrderHeader => ({
  orderNumber: header.orderNumber,
  note: header.note,
  createdBy: header.createdBy,
  orderStatus: header.orderStatus.name,
  orderStatusCode: header.orderStatus.code,
  orderStatusId: header.orderStatus.id,
  salespersonId: header.salesperson.id,
  salespersonName: header.salesperson.fullName,
});

/**
 * Normalizes batch information across product and packaging material batches.
 *
 * - Resolves batch type via runtime guards
 * - Extracts common batch fields
 * - Falls back to `unknown` when batch data is missing or unrecognized
 *
 * Internal helper – not exported.
 */
export const parseBatch = (
  batch: BatchReview | null | undefined
): {
  batchLotNumber: string | null;
  batchExpiryDate: string | null;
  manufactureDate: string | null;
  batchType: 'product' | 'packaging_material' | 'unknown';
} => {
  // --- No batch provided ---
  if (!batch) {
    return {
      batchLotNumber: null,
      batchExpiryDate: null,
      manufactureDate: null,
      batchType: 'unknown',
    };
  }

  // --- Valid domain batch (product or packaging material) ---
  if (isProductBatch(batch) || isPackagingBatch(batch)) {
    return {
      batchLotNumber: batch.lotNumber ?? null,
      batchExpiryDate: batch.expiryDate ?? null,
      manufactureDate: batch.manufactureDate ?? null,
      batchType: batch.type,
    };
  }

  // --- Fallback (defensive) ---
  return {
    batchLotNumber: null,
    batchExpiryDate: null,
    manufactureDate: null,
    batchType: 'unknown',
  };
};

/**
 * Flattens allocation review items into a UI-ready structure.
 *
 * Responsibilities:
 * - Normalize nullable backend fields
 * - Resolve batch, product, and packaging material data
 * - Apply safe defaults for display and calculations
 *
 * This function intentionally contains no domain validation
 * or business rule enforcement.
 */
export const flattenInventoryAllocationReviewItems = (
  items: AllocationReviewItem[]
): FlattenedAllocationReviewItem[] => {
  return items.map((item) => {
    const {
      allocationId,
      allocationStatusName,
      allocationStatusCode,
      allocatedQuantity,
      createdAt,
      updatedAt,
      createdBy,
      updatedBy,
      product,
      packagingMaterial,
      orderItem,
      batch,
      warehouseInventoryList,
    } = item;

    const { batchLotNumber, batchExpiryDate, manufactureDate, batchType } =
      parseBatch(batch);

    return {
      allocationId,
      allocationStatus: allocationStatusName ?? '—',
      allocationStatusCode: allocationStatusCode ?? '',
      allocatedQuantity: allocatedQuantity ?? 0,
      createdAt: createdAt ?? '',
      updatedAt: updatedAt ?? createdAt ?? '',

      orderItemId: orderItem?.id ?? '—',
      orderId: orderItem?.orderId ?? '—',
      orderItemStatusName: orderItem?.statusName ?? '—',
      orderItemStatusCode: orderItem?.statusCode ?? '—',
      orderItemStatusDate: orderItem?.statusDate ?? '',
      quantityOrdered: orderItem?.quantityOrdered ?? 0,

      skuCode: product?.skuCode ?? null,
      barcode: product?.barcode ?? null,
      productName: product?.displayName ?? null,

      packagingMaterialCode: packagingMaterial?.code ?? null,
      packagingMaterialLabel: packagingMaterial?.label ?? null,

      batchLotNumber,
      batchExpiryDate,
      manufactureDate,
      batchType,

      createdByName: createdBy?.fullName ?? '—',
      updatedByName: updatedBy?.fullName ?? '—',

      warehouseInventoryList: Array.isArray(warehouseInventoryList)
        ? warehouseInventoryList.map((wi) => ({
            id: wi.id,
            warehouseQuantity: wi.warehouseQuantity ?? 0,
            reservedQuantity: wi.reservedQuantity ?? 0,
            statusName: wi.statusName ?? '—',
            statusDate: wi.statusDate ?? '',
            inboundDate: wi.inboundDate ?? '',
            warehouseName: wi.warehouseName ?? '—',
          }))
        : [],
    };
  });
};
