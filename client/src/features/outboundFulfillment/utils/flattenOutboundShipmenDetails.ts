import type {
  FlattenedFulfillmentRow,
  FlattenedShipmentHeader,
  Fulfillment,
  ShipmentHeader,
} from '@features/outboundFulfillment/state';

/**
 * Flattens a nested `ShipmentHeader` API model into a
 * UI-friendly `FlattenedShipmentHeader`.
 *
 * This transformation:
 * - Normalizes deeply nested relations (warehouse, delivery method, status, tracking)
 * - Converts optional sub-objects into nullable scalar fields
 * - Preserves audit and tracking metadata for display
 *
 * Design notes:
 * - Intended to run **once** at the thunk / ingestion boundary
 * - UI components MUST consume `FlattenedShipmentHeader` only
 * - Returns `null` if the input header is missing
 *
 * @param header - Raw shipment header returned from the API
 * @returns A flattened shipment header or `null` if no header is provided
 */
export const flattenShipmentHeader = (
  header: ShipmentHeader | null | undefined
): FlattenedShipmentHeader | null => {
  if (!header) return null;

  return {
    shipmentId: header.shipmentId,
    orderId: header.orderId,
    warehouseId: header.warehouse?.id ?? null,
    warehouseName: header.warehouse?.name ?? null,

    // delivery method
    deliveryMethodId: header.deliveryMethod?.id ?? null,
    deliveryMethodName: header.deliveryMethod?.name ?? null,
    deliveryMethodIsPickup: header.deliveryMethod?.isPickup ?? null,
    deliveryMethodEstimatedTime: header.deliveryMethod?.estimatedTime
      ? typeof header.deliveryMethod.estimatedTime === 'object'
        ? `${header.deliveryMethod.estimatedTime.days} days`
        : String(header.deliveryMethod.estimatedTime)
      : null,

    // shipment status
    statusId: header.status?.id ?? null,
    statusCode: header.status?.code ?? null,
    statusName: header.status?.name ?? null,

    shippedAt: header.shippedAt,
    expectedDeliveryDate: header.expectedDeliveryDate,
    notes: header.notes,
    details: header.details,

    // audit
    createdAt: header.audit?.createdAt ?? null,
    createdByName: header.audit?.createdBy?.name ?? null,
    updatedAt: header.audit?.updatedAt ?? null,
    updatedByName: header.audit?.updatedBy?.name ?? null,

    // tracking
    trackingId: header.tracking?.id ?? null,
    trackingNumber: header.tracking?.number ?? null,
    trackingCarrier: header.tracking?.carrier ?? null,
    trackingService: header.tracking?.serviceName ?? null,
    trackingBolNumber: header.tracking?.bolNumber ?? null,
    trackingFreightType: header.tracking?.freightType ?? null,
    trackingNotes: header.tracking?.notes ?? null,
    trackingShippedDate: header.tracking?.shippedDate ?? null,
    trackingStatusId: header.tracking?.status?.id ?? null,
    trackingStatusName: header.tracking?.status?.name ?? null,
  };
};

/**
 * Flattens an array of `Fulfillment` API records into
 * table-ready `FlattenedFulfillmentRow` objects.
 *
 * This transformation:
 * - Normalizes fulfillment status and audit fields
 * - Extracts SKU / packaging material display data
 * - Flattens nested batch shipment records
 * - Produces a stable, nullable-safe structure for UI rendering
 *
 * Design notes:
 * - Must be executed at the thunk / data ingestion layer
 * - UI components should NEVER access raw `Fulfillment` models
 * - Returns an empty array if no fulfillments are provided
 *
 * @param fulfillments - Raw fulfillment records from the API
 * @returns Flattened fulfillment rows suitable for tables and detail panels
 */
export const flattenFulfillments = (
  fulfillments: Fulfillment[] | null | undefined
): FlattenedFulfillmentRow[] => {
  if (!fulfillments || fulfillments.length === 0) return [];

  return fulfillments.map((f) => ({
    fulfillmentId: f.fulfillmentId,
    fulfillmentStatusCode: f.status?.code ?? null,
    fulfillmentStatusName: f.status?.name ?? null,
    quantityFulfilled: f.quantityFulfilled ?? null,
    fulfilledAt: f.fulfilledAt ?? null,
    fulfillmentNote: f.notes ?? null,

    // audit
    createdAt: f.audit?.createdAt ?? null,
    createdByName: f.audit?.createdBy?.name ?? null,
    updatedAt: f.audit?.updatedAt ?? null,
    updatedByName: f.audit?.updatedBy?.name ?? null,
    fulfilledByName: f.audit?.fulfilledBy?.name ?? null,

    // order item snapshot
    orderItemId: f.orderItem?.id ?? null,
    orderItemQuantity: f.orderItem?.quantityOrdered ?? null,
    productName: f.orderItem?.sku?.product?.name ?? null,
    skuCode: f.orderItem?.sku?.code ?? null,
    barcode: f.orderItem?.sku?.barcode ?? null,
    category: f.orderItem?.sku?.product?.category ?? null,
    region: f.orderItem?.sku?.region ?? null,
    sizeLabel: f.orderItem?.sku?.sizeLabel ?? null,
    packagingMaterialCode: f.orderItem?.packagingMaterial?.code ?? null,
    packagingMaterialLabel: f.orderItem?.packagingMaterial?.label ?? null,

    // shipment batches
    batches: f.batches.map((b) => ({
      shipmentBatchId: b.shipmentBatchId,
      batchRegistryId: b.batchRegistryId ?? null,
      batchType: b.batchType ?? null,
      lotNumber: b.lotNumber ?? null,
      expiryDate: b.expiryDate ?? null,
      quantityShipped: b.quantityShipped ?? null,
      notes: b.notes ?? null,
      createdAt: b.audit?.createdAt ?? null,
      createdByName: b.audit?.createdBy?.name ?? null,
    })),
  }));
};
