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
export const mapInventoryRecordToAdjustData = (record: InventoryRecord): AdjustedInventoryData => {
  const batchType = record.itemType ?? 'product';
  
  let warehouseName: string | undefined;
  let warehouseId = record.warehouse?.id ?? ''; // fallback even if the guard fails
  let warehouseQuantity: number | undefined;
  
  if (isWarehouseRecord(record)) {
    warehouseName = record.warehouse.name;
    warehouseId = record.warehouse.id ?? warehouseId;
    warehouseQuantity = record.quantity.warehouseQuantity;
  }
  
  let locationName: string | undefined;
  let locationId = record.location?.id ?? ''; // fallback even if the guard fails
  let locationQuantity: number | undefined;
  
  if (isLocationRecord(record)) {
    locationName = record.location.name;
    locationId = record.location.id ?? locationId;
    locationQuantity = record.quantity.locationQuantity;
  }
  
  const requiredFields = {
    id: record.id,
    batchType,
    warehouseId,
    locationId,
    displayName: record.display.name,
    batchId: record.lot.batchId,
    lotNumber: record.lot.number,
    expiryDate: record.lot.expiryDate ?? '',
    status: record.status.name,
  };
  
  const optionalFields = cleanObject({
    warehouseName,
    locationName,
    warehouseQuantity,
    locationQuantity,
  });
  
  return {
    ...requiredFields,
    ...optionalFields,
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
