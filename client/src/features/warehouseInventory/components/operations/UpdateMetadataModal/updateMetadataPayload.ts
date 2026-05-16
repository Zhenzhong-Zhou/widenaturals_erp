import type {
  UpdateWarehouseInventoryMetadataRequest,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';

/**
 * Builds the metadata update payload from form values, including only
 * fields that actually changed from the original record. An empty payload
 * is the modal's signal that the submission is a no-op and the request
 * should be skipped entirely.
 */
export const buildUpdateMetadataPayload = (
  values: Record<string, any>,
  original: WarehouseInventoryDetailRecord
): UpdateWarehouseInventoryMetadataRequest => {
  const payload: UpdateWarehouseInventoryMetadataRequest = {};

  if (values.inboundDate) {
    payload.inboundDate = values.inboundDate;
  }

  if (
    values.warehouseFee !== '' &&
    values.warehouseFee !== original.warehouseFee
  ) {
    payload.warehouseFee = Number(values.warehouseFee);
  }

  return payload;
};
