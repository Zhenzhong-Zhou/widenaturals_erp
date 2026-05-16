import type {
  FlattenedWarehouseInventory,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';

/**
 * Builds a human-readable inventory record label from a flattened list row.
 *
 * Product records use lot number, SKU, and product name.
 * Packaging records use lot number and material code.
 *
 * Output format mirrors getDetailRecordInventoryLabel so the two adapters
 * produce visually identical labels regardless of the source shape.
 */
export const getFlattenedInventoryLabel = (
  item: FlattenedWarehouseInventory
): string => {
  if (item.batchType === 'product') {
    return [item.productLotNumber, item.sku, item.productName]
      .filter(Boolean)
      .join(' · ');
  }
  return [item.packagingLotNumber, item.materialCode]
    .filter(Boolean)
    .join(' · ');
};

/**
 * Builds a human-readable inventory record label from a detail record.
 *
 * Product records use lot number, SKU, and product name.
 * Packaging records use lot number and material code.
 *
 * Output format mirrors getFlattenedInventoryLabel so the two adapters
 * produce visually identical labels regardless of the source shape.
 */
export const getDetailRecordInventoryLabel = (
  r: WarehouseInventoryDetailRecord
): string => {
  if (r.batchType === 'product') {
    return [
      r.productInfo?.batch.lotNumber,
      r.productInfo?.sku?.sku,
      r.productInfo?.product?.name,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return [r.packagingInfo?.batch.lotNumber, r.packagingInfo?.material?.code]
    .filter(Boolean)
    .join(' · ');
};

/**
 * Builds the initial form rows for bulk status updates.
 *
 * Keeps only payload-relevant values in form state. Display metadata
 * should stay in BatchUpdateStatusForm's sidecar row metadata map.
 */
export const buildUpdateStatusDefaultValues = (
  selectedItems: FlattenedWarehouseInventory[]
): Array<{
  id: string;
  statusId: string | null | undefined;
}> =>
  selectedItems.map((item) => ({
    id: item.id,
    statusId: item.statusId,
  }));

/**
 * Returns the modal title based on whether the update is single-record
 * or bulk.
 */
export const getUpdateStatusModalTitle = (
  selectedItems: FlattenedWarehouseInventory[]
): string =>
  selectedItems.length > 1
    ? `Update Status — ${selectedItems.length} Records`
    : 'Update Status';
