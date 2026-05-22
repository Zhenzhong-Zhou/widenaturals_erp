import type {
  FlattenedOutboundShipmentRow,
  OutboundShipmentRecord,
} from '@features/outboundFulfillment';

/**
 * Flattens a raw outbound shipment record returned by the API into a
 * canonical, UI-ready row structure.
 *
 * This transformation:
 * - Normalizes nested relations (order, warehouse, status, delivery method)
 * - Converts optional backend fields into nullable UI-safe values
 * - Produces a stable structure suitable for tables and list views
 * - Surfaces tracking as a primary-summary triple (number + carrier + count)
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
  
  // delivery method
  deliveryMethodId: raw.deliveryMethod?.id ?? null,
  deliveryMethodName: raw.deliveryMethod?.name ?? null,
  deliveryMethodRequiresTracking:
    raw.deliveryMethod?.requiresTracking ?? false,
  
  // tracking summary (primary + count)
  primaryTrackingNumber: raw.tracking?.primaryNumber ?? null,
  primaryCarrier: raw.tracking?.primaryCarrier ?? null,
  trackingCount: raw.tracking?.count ?? 0,
  
  // status
  statusId: raw.status.id,
  statusCode: raw.status.code,
  statusName: raw.status.name,
  
  // dates
  shippedAt: raw.dates.shippedAt,
  expectedDelivery: raw.dates.expectedDelivery,
  
  // notes & metadata
  notes: raw.notes,
  shipmentDetails: raw.shipmentDetails,
  
  // audit
  createdAt: raw.audit.createdAt ?? '',
  createdBy: raw.audit?.createdBy?.name ?? '',
  updatedAt: raw.audit?.updatedAt ?? '',
  updatedBy: raw.audit.updatedBy?.name ?? '',
});
