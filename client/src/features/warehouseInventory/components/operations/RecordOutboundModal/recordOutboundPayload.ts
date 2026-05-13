import type {
  RecordWarehouseInventoryOutboundRequest,
  WarehouseInventoryDetailRecord,
} from '@features/warehouseInventory';

/**
 * Builds the bulk record-outbound request body for a single record.
 *
 * Wraps a single entry in the same `updates[]` shape used by the bulk
 * endpoint so the modal and the (future) batch path can share one route.
 */
export const buildRecordOutboundPayload = (
  record: WarehouseInventoryDetailRecord,
  values: Record<string, any>
): RecordWarehouseInventoryOutboundRequest => ({
  updates: [
    {
      id: record.id,
      outboundDate: values.outboundDate,
      warehouseQuantity: Number(values.warehouseQuantity),
    },
  ],
});
