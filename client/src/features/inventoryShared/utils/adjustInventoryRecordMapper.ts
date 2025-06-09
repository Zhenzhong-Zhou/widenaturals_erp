import type { WarehouseInventoryRecord } from "@features/warehouseInventory/state";
import type { LocationInventoryRecord } from '@features/locationInventory/state';
import type { AdjustedInventoryData, InventoryRecord } from '@features/inventoryShared/types/InventorySharedType';
import { cleanObject } from '@utils/objectUtils';

const isWarehouseRecord = (record: InventoryRecord): record is WarehouseInventoryRecord => {
  return (
    'warehouse' in record &&
    typeof record.warehouse === 'object' &&
    'name' in record.warehouse
  );
}

const isLocationRecord = (record: InventoryRecord): record is LocationInventoryRecord => {
  return (
    'location' in record &&
    typeof record.location === 'object' &&
    'name' in record.location
  );
}

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
  } = record;
  
  const batchType = itemType ?? 'product';
  
  const optionalFields: Partial<AdjustedInventoryData> = {};
  
  if (isWarehouseRecord(record)) {
    optionalFields.warehouseName = record.warehouse.name;
    optionalFields.warehouseId = record.warehouse.id;
    optionalFields.warehouseQuantity = record.quantity.warehouseQuantity;
  }
  
  if (isLocationRecord(record)) {
    optionalFields.locationName = record.location.name;
    optionalFields.locationId = record.location.id;
    optionalFields.locationQuantity = record.quantity.locationQuantity;
  }
  
  return cleanObject({
    id,
    batchType,
    displayName,
    batchId,
    lotNumber,
    expiryDate: expiryDate ?? '',
    status,
    ...optionalFields,
  }) as AdjustedInventoryData;
};

/**
 * Maps an array of InventoryRecords to AdjustedInventoryData[]
 */
export const mapInventoryRecordsToAdjustData = (
  records: InventoryRecord[]
): AdjustedInventoryData[] => {
  return records.map(mapInventoryRecordToAdjustData);
};
