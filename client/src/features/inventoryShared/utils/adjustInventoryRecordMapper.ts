import type {
  AdjustedInventoryData,
  InventoryRecord,
} from '@features/inventoryShared/types/InventorySharedType';
import { cleanObject } from '@utils/objectUtils';

/**
 * Maps a single InventoryRecord to AdjustedInventoryData.
 */
export const mapInventoryRecordToAdjustData = (
  record: InventoryRecord
): AdjustedInventoryData => {
  const {
    id,
    itemType,
    display: { name: displayName },
    lot: { batchId, number: lotNumber, expiryDate },
    status: { name: status },
    warehouse,
    location,
    quantity,
  } = record;

  const batchType = itemType ?? 'product';

  // Required fields always present
  const required: AdjustedInventoryData = {
    id,
    batchType,
    displayName,
    batchId,
    lotNumber,
    expiryDate: expiryDate ?? '',
    status,
    warehouseId: warehouse.id,
    locationId: location.id,
  };

  // Conditionally add optional fields
  const optionalFields: Partial<AdjustedInventoryData> = {
    warehouseName: 'name' in warehouse ? warehouse.name : undefined,
    warehouseQuantity:
      'warehouseQuantity' in quantity ? quantity.warehouseQuantity : undefined,
    locationName: 'name' in location ? location.name : undefined,
    locationQuantity:
      'locationQuantity' in quantity ? quantity.locationQuantity : undefined,
  };

  return {
    ...required,
    ...cleanObject(optionalFields),
  };
};

/**
 * Maps an array of InventoryRecords to AdjustedInventoryData[]
 */
export const mapInventoryRecordsToAdjustData = (
  records: InventoryRecord[]
): AdjustedInventoryData[] => {
  return records.map(mapInventoryRecordToAdjustData);
};
