import type {
  FlattenedOutboundShipmentRow,
  OutboundShipmentRecord,
} from '@features/outboundFulfillment';

/**
 * Flattens a raw outbound shipment record returned by the API into a
 * canonical, UI-ready row structure.
 *
 * This transformation:
 * - Normalizes nested relations (order, warehouse, status, allocations)
 * - Converts optional backend fields into nullable UI-safe values
 * - Produces a stable structure suitable for tables and list views
 *
 * Design notes:
 * - Must be executed at the thunk ingestion boundary
 * - UI components MUST NOT consume raw API shipment models
 *
 * @param raw Raw outbound shipment record from the backend
 * @returns FlattenedOutboundShipmentRow
 */
export const flattenOutboundShipment = (
  raw: OutboundShipmentRecord
): FlattenedOutboundShipmentRow => ({
  shipmentId: raw.shipmentId,

  orderId: raw.order.id,
  orderNumber: raw.order.number,

  warehouseId: raw.warehouse.id,
  warehouseName: raw.warehouse.name,

  deliveryMethodId: raw.deliveryMethod?.id ?? null,
  deliveryMethodName: raw.deliveryMethod?.name ?? null,

  trackingId: raw.trackingNumber?.id ?? null,
  trackingNumber: raw.trackingNumber?.number ?? null,

  statusId: raw.status.id,
  statusCode: raw.status.code,
  statusName: raw.status.name,

  shippedAt: raw.dates.shippedAt,
  expectedDelivery: raw.dates.expectedDelivery,

  notes: raw.notes,
  shipmentDetails: raw.shipmentDetails,

  createdAt: raw.audit.createdAt,
  createdById: raw.audit.createdBy.id,
  createdByName: raw.audit.createdBy.fullName,
  updatedAt: raw.audit.updatedAt,
  updatedById: raw.audit.updatedBy.id,
  updatedByName: raw.audit.updatedBy.fullName,
});
