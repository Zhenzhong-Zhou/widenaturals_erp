import type { FlattenedWarehouseInventory } from '@features/warehouseInventory';

/**
 * Builds a human-readable inventory record label for single-record display.
 *
 * Product records use lot number, SKU, and product name.
 * Packaging records use lot number and material code.
 */
export const getWarehouseInventoryItemLabel = (
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
