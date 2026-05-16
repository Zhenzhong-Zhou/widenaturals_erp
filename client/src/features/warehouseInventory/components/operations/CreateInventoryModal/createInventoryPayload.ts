import type { CreateWarehouseInventoryRequest } from '@features/warehouseInventory';

/**
 * Maps MultiItemForm row values to the CreateWarehouseInventoryRequest
 * shape expected by the warehouse-inventory create endpoint.
 *
 * Optional fields (warehouseFee, inboundDate, statusId) are spread in
 * conditionally so empty-string and null values never reach the wire.
 */
export const buildCreateInventoryPayload = (
  rows: Record<string, any>[]
): CreateWarehouseInventoryRequest => ({
  records: rows.map((r) => ({
    batchId: r.batchId,
    warehouseQuantity: Number(r.warehouseQuantity),
    ...(r.warehouseFee !== '' &&
      r.warehouseFee != null && {
        warehouseFee: Number(r.warehouseFee),
      }),
    ...(r.inboundDate && { inboundDate: r.inboundDate }),
    ...(r.statusId && { statusId: r.statusId }),
  })),
});
