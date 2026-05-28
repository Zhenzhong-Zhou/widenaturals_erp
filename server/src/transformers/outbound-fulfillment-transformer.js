/**
 * @file outbound-fulfillment-transformer.js
 * @description Transformers for outbound fulfillment, outbound shipment, and
 * tracking-related records.
 *
 * Maps raw DB rows from outbound-fulfillment-service and
 * outbound-shipment-repository into canonical API/business response shapes
 * consumed by the frontend and service layer.
 *
 * Tracking handling (post-tracking refactor):
 *  - Detail rows carry a single `tracking_numbers` jsonb array aggregated by a
 *    LATERAL subquery on tracking_numbers. The array is identical across the
 *    fulfillment × batch fan-out for one shipment and is read once from rows[0].
 *  - List rows carry primary tracking summary fields (tracking_number, carrier,
 *    tracking_count) from a separate LATERAL subquery. Shipments do not fan out
 *    when multiple tracking numbers exist.
 *  - Tracking-attach rows are transformed into a compact shipment context used
 *    by the tracking-number service for warehouse, status, and delivery-method
 *    validation.
 *  - Tracking-number create results are transformed into a lean `{ count, ids }`
 *    response after successful insert.
 *
 * Exports:
 *   - transformFulfillmentResult
 *       Minimal result after initial fulfillment creation.
 *   - transformAdjustedFulfillmentResult
 *       Full result after fulfillment confirmation.
 *   - transformPaginatedOutboundShipmentResults
 *       Paginated shipment list.
 *   - transformShipmentDetailsRows
 *       Grouped shipment detail with tracking, fulfillments, and batches.
 *   - transformOutboundFulfillmentCompletionResult
 *       Result after outbound fulfillment completion (pickup or carrier).
 *   - transformOutboundShipmentForTrackingAttachRow
 *       Shipment context used before attaching tracking numbers.
 *   - transformCreateTrackingNumbersResult
 *       Lean result after creating tracking-number records.
 *   - transformDeliveryConfirmationResult
 *       Result after shipment delivery confirmation, including delivered_at
 *       stamps for shipments transitioning to DELIVERED.
 *
 * Internal helpers (not exported):
 *   - transformOutboundShipmentRow
 *       Per-row transformer for paginated shipment list.
 *
 * All functions are pure — no logging, no AppError, no database access, and no
 * side effects.
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/person-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const {
  formatPackagingMaterialLabel,
} = require('../utils/packaging-material-utils');
const { makeAudit, compactAudit } = require('../utils/audit-utils');

/**
 * Transforms the minimal result of an initial outbound fulfillment creation.
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {Object} params.shipmentRow
 * @param {Array}  params.fulfillmentRowsWithStatus
 * @param {Object} params.shipmentBatchRow
 * @param {Object} params.orderStatusRow
 * @param {Array}  params.orderItemStatusRows
 * @returns {Object}
 */
const transformFulfillmentResult = ({
                                      orderId,
                                      shipmentRow,
                                      fulfillmentRowsWithStatus,
                                      shipmentBatchRow,
                                      orderStatusRow,
                                      orderItemStatusRows,
                                    }) => {
  const fulfillmentRow = fulfillmentRowsWithStatus?.[0] ?? null;

  return cleanObject({
    orderId,
    orderStatus: {
      id: orderStatusRow?.order_status_id ?? null,
      updatedAt: orderStatusRow?.status_date ?? null,
    },
    shipment: {
      id: shipmentRow?.id ?? null,
      batchId: shipmentBatchRow?.id ?? null,
    },
    fulfillment: {
      id: fulfillmentRow?.id ?? null,
      statusId: fulfillmentRow?.status_id ?? null,
    },
    statusUpdates: {
      updatedOrderItemStatusIds: orderItemStatusRows?.map((row) => row.id) ?? [],
    },
  });
};

/**
 * Transforms the full result of an outbound fulfillment confirmation,
 * including inventory, status, and log metadata.
 *
 * @param {Object} params
 * @returns {Object}
 */
const transformAdjustedFulfillmentResult = ({
                                              orderId,
                                              orderNumber,
                                              fulfillments,
                                              shipmentId,
                                              warehouseInventoryIds,
                                              orderStatusRow,
                                              orderItemStatusRows,
                                              inventoryAllocationStatusRows,
                                              orderFulfillmentStatusRows,
                                              shipmentStatusRows,
                                              logMetadata,
                                            }) => ({
  order: {
    id: orderId,
    number: orderNumber,
  },
  shipment: {
    id: shipmentId,
    statuses: shipmentStatusRows,
  },
  fulfillments: fulfillments.map((f) => ({
    id: f.fulfillment_id,
    statusId: f.status_id,
  })),
  inventory: {
    updatedWarehouseIds: warehouseInventoryIds,
  },
  statuses: {
    order: orderStatusRow,
    orderItems: orderItemStatusRows,
    allocations: inventoryAllocationStatusRows,
    fulfillments: orderFulfillmentStatusRows,
    shipments: shipmentStatusRows,
  },
  logs: logMetadata,
});

/**
 * Transforms a single paginated outbound shipment DB row into the list view shape.
 *
 * Tracking is surfaced from a LATERAL subquery on the underlying list query —
 * each row carries the primary (oldest) tracking number plus a total count.
 * Shipments with no tracking yet have tracking: null.
 *
 * @param {Object} row
 * @returns {Object}
 */
const transformOutboundShipmentRow = (row) =>
  cleanObject({
    shipmentId: row.shipment_id,
    order: {
      id: row.order_id,
      number: row.order_number,
    },
    warehouse: {
      id: row.warehouse_id,
      name: row.warehouse_name ?? null,
    },
    deliveryMethod: row.delivery_method
      ? {
        id: row.delivery_method_id,
        name: row.delivery_method,
        requiresTracking: row.requires_tracking_number ?? false,
      }
      : null,
    tracking: row.tracking_number
      ? {
        primaryNumber: row.tracking_number,
        primaryCarrier: row.carrier ?? null,
        count: parseInt(row.tracking_count ?? 0, 10),
      }
      : null,
    status: {
      id: row.status_id,
      code: row.status_code,
      name: row.status_name,
    },
    dates: {
      shippedAt: row.shipped_at ?? null,
      expectedDelivery: row.expected_delivery_date ?? null,
    },
    notes: row.notes ?? null,
    shipmentDetails: row.shipment_details ?? null,
    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated outbound shipment result set into the list view shape.
 *
 * @param {Object} paginatedResult
 * @returns {Promise<PaginatedResult<Object>>}
 */
const transformPaginatedOutboundShipmentResults = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<Object>>} */
  (transformPageResult(paginatedResult, transformOutboundShipmentRow));

/**
 * Transforms flat shipment detail rows into a grouped header + fulfillments shape.
 *
 * Groups rows by fulfillment ID, accumulates shipment batches per fulfillment,
 * and builds order item detail (SKU or packaging material) per fulfillment.
 * Returns `null` if the input is empty.
 *
 * @param {Array<Object>} rows - Raw DB rows from the shipment detail query.
 * @returns {Object|null}
 */
const transformShipmentDetailsRows = (rows) => {
  if (!rows || !rows.length) return null;
  
  const first = rows[0];
  
  const header = {
    shipmentId: first.shipment_id,
    orderId: first.order_id,
    warehouse: {
      id: first.warehouse_id,
      name: first.warehouse_name,
    },
    deliveryMethod: first.delivery_method_id
      ? {
        id: first.delivery_method_id,
        name: first.delivery_method_name,
        isPickup: first.delivery_method_is_pickup,
        requiresTracking: first.delivery_method_requires_tracking ?? false,
        estimatedTime: first.delivery_method_estimated_time,
      }
      : null,
    status: {
      id: first.shipment_status_id,
      code: first.shipment_status_code,
      name: first.shipment_status_name,
    },
    shippedAt: first.shipped_at,
    expectedDeliveryDate: first.expected_delivery_date,
    notes: first.shipment_notes,
    details: first.shipment_details,
    audit: compactAudit(
      makeAudit(first, {
        map: {
          createdAt: 'created_at',
          createdById: 'created_by',
          createdByFirstName: 'shipment_created_by_firstname',
          createdByLastName: 'shipment_created_by_lastname',
          updatedAt: 'updated_at',
          updatedById: 'updated_by',
          updatedByFirstName: 'shipment_updated_by_firstname',
          updatedByLastName: 'shipment_updated_by_lastname',
        },
      })
    ),
    trackingNumbers: Array.isArray(first.tracking_numbers)
      ? first.tracking_numbers.map((t) => ({
        id: t.id,
        number: t.tracking_number,
        carrier: t.carrier,
        serviceName: t.service_name,
        bolNumber: t.bol_number,
        freightType: t.freight_type,
        notes: t.notes,
        shippedDate: t.shipped_date,
        status:
          t.status_id != null
            ? { id: t.status_id, name: t.status_name }
            : null,
        createdAt: t.created_at,
      }))
      : [],
  };
  
  const fulfillmentsMap = new Map();
  
  for (const row of rows) {
    if (!row.fulfillment_id) continue;
    
    if (!fulfillmentsMap.has(row.fulfillment_id)) {
      fulfillmentsMap.set(row.fulfillment_id, {
        fulfillmentId: row.fulfillment_id,
        quantityFulfilled: row.quantity_fulfilled,
        fulfilledBy: row.fulfilled_by
          ? {
            id: row.fulfilled_by,
            name: getFullName(
              row.fulfillment_fulfilled_by_firstname,
              row.fulfillment_fulfilled_by_lastname
            ),
          }
          : null,
        fulfilledAt: row.fulfilled_at,
        notes: row.fulfillment_notes,
        status: {
          id: row.fulfillment_status_id,
          code: row.fulfillment_status_code,
          name: row.fulfillment_status_name,
        },
        audit: compactAudit(makeAudit(row, { prefix: 'fulfillment_' })),
        orderItem: row.order_item_id
          ? {
            id: row.order_item_id,
            quantityOrdered: row.quantity_ordered,
            ...(row.sku_id && row.product_id
              ? {
                sku: {
                  id: row.sku_id,
                  code: row.sku,
                  barcode: row.barcode,
                  sizeLabel: row.size_label,
                  region: row.market_region,
                  product: {
                    id: row.product_id,
                    name: getProductDisplayName(row),
                    category: row.category,
                  },
                },
              }
              : row.packaging_material_id
                ? {
                  packagingMaterial: {
                    id: row.packaging_material_id,
                    code: row.packaging_material_code,
                    label:
                      row.material_snapshot_name ||
                      formatPackagingMaterialLabel({
                        name: row.packaging_material_name,
                        size: row.packaging_material_size,
                        color: row.packaging_material_color,
                        unit: row.packaging_material_unit,
                        length_cm: row.packaging_material_length_cm,
                        width_cm: row.packaging_material_width_cm,
                        height_cm: row.packaging_material_height_cm,
                      }),
                  },
                }
                : {}),
          }
          : null,
        batches: [],
      });
    }
    
    if (row.shipment_batch_id) {
      const fulfillment = fulfillmentsMap.get(row.fulfillment_id);
      if (!fulfillment) continue;
      
      const batch = {
        shipmentBatchId: row.shipment_batch_id,
        quantityShipped: row.quantity_shipped,
        notes: row.shipment_batch_notes,
        audit: compactAudit(makeAudit(row, { prefix: 'shipment_batch_' })),
        batchRegistryId: row.batch_registry_id,
        batchType: row.batch_type,
      };
      
      if (row.batch_type === 'product') {
        Object.assign(batch, {
          lotNumber: row.product_lot_number,
          expiryDate: row.product_expiry_date,
        });
      }
      
      if (row.batch_type === 'packaging_material') {
        Object.assign(batch, {
          lotNumber: row.material_lot_number,
          expiryDate: row.material_expiry_date,
        });
      }
      
      fulfillment.batches.push(batch);
    }
  }
  
  return cleanObject({
    shipment: header,
    fulfillments: Array.from(fulfillmentsMap.values()),
  });
};

/**
 * Transforms the result of an outbound fulfillment completion, covering both
 * pickup and carrier-tracked delivery paths.
 *
 * @param {Object} statusResult
 * @param {Object} [statusResult.orderStatusRow]
 * @param {Object[]} [statusResult.orderItemStatusRows]
 * @param {Array<{ id: string }>} [statusResult.orderFulfillmentStatusRows] - Updated fulfillment rows.
 * @param {string[]} [statusResult.shipmentStatusRows]
 * @param {Object[]} [statusResult.insertedTrackings]
 * @returns {Object}
 */
const transformOutboundFulfillmentCompletionResult = (statusResult) => {
  if (!statusResult) return {};
  
  const {
    orderStatusRow,
    orderItemStatusRows,
    orderFulfillmentStatusRows,
    shipmentStatusRows,
    insertedTrackings,
  } = statusResult;
  
  return cleanObject({
    order: orderStatusRow
      ? {
        id: orderStatusRow.id,
        statusId: orderStatusRow.order_status_id,
        statusDate: orderStatusRow.status_date,
      }
      : null,
    items: Array.isArray(orderItemStatusRows)
      ? orderItemStatusRows.map((item) => ({
        id: item.id,
        statusId: item.status_id,
        statusDate: item.status_date,
      }))
      : [],
    fulfillments: Array.isArray(orderFulfillmentStatusRows)
      ? orderFulfillmentStatusRows.map((id) => ({ id }))
      : [],
    shipment: Array.isArray(shipmentStatusRows)
      ? shipmentStatusRows.map((id) => ({ id }))
      : [],
    trackings: Array.isArray(insertedTrackings)
      ? insertedTrackings.map((t) => ({ id: t.id }))
      : [],
    summary: {
      orderItemsCount: orderItemStatusRows?.length || 0,
      fulfillmentsCount: orderFulfillmentStatusRows?.length || 0,
      shipmentCount: shipmentStatusRows?.length || 0,
      trackingsCount: insertedTrackings?.length || 0,
    },
    meta: {
      updatedAt: new Date().toISOString(),
    },
  });
};

/**
 * Transforms a raw outbound-shipment tracking-attach SQL row into the
 * normalized shipment context consumed by the tracking-attach business layer.
 *
 * @param {OutboundShipmentTrackingAttachRow} row
 * @returns {OutboundShipmentTrackingAttachContext}
 */
const transformOutboundShipmentForTrackingAttachRow = (row) => ({
  id: row.id ?? row.shipment_id,
  orderId: row.order_id,
  warehouseId: row.warehouse_id,
  deliveryMethodId: row.delivery_method_id,
  statusId: row.status_id,
  statusCode: row.status_code,
  statusName: row.status_name,
  deliveryMethod: {
    id: row.delivery_method_id,
    methodName: row.method_name ?? row.delivery_method_name,
    isPickupLocation: row.is_pickup_location,
    requiresTrackingNumber: row.requires_tracking_number,
    isCarrierTracked: row.is_carrier_tracked,
  },
});

/**
 * Transforms inserted tracking-number rows into the lean service result.
 *
 * @param {TrackingNumberInsertResultRow[]} insertedRecords
 * @returns {CreateTrackingNumbersResult}
 */
const transformCreateTrackingNumbersResult = (insertedRecords) => ({
  count: insertedRecords.length,
  ids: insertedRecords.map((record) => record.id),
});

/**
 * Transforms the raw status-update result from delivery confirmation into the
 * canonical API response shape.
 *
 * Maps order, order-item, fulfillment, and shipment status rows produced by
 * the delivery flow, plus the delivered-at stamp rows from
 * markOutboundShipmentsDelivered. Fulfillment and shipment rows carry only
 * IDs; delivered-at rows additionally carry the stamped timestamp.
 *
 * Returns an empty object when `statusResult` is null or undefined. Empty
 * arrays are produced when a section's source rows are missing.
 *
 * @param {object} [statusResult]
 * @param {{ id: string, order_status_id: string, status_date: string }} [statusResult.orderStatusRow]
 * @param {Array<{ id: string, status_id: string, status_date: string }>}  [statusResult.orderItemStatusRows]
 * @param {Array<{ id: string }>} [statusResult.orderFulfillmentStatusRows] - Updated fulfillment rows.
 * @param {string[]} [statusResult.shipmentStatusRows]         - Updated shipment UUIDs.
 * @param {Array<{ id: string, delivered_at: string }>} [statusResult.deliveredAtRows]
 *        Shipments stamped with delivered_at in this transaction.
 *
 * @returns {object} Canonical delivery confirmation response with
 *                   order/items/fulfillments/shipment/deliveredShipments
 *                   sections, a counts summary, and an updatedAt meta stamp.
 */
const transformDeliveryConfirmationResult = (statusResult) => {
  if (!statusResult) return {};
  
  const {
    orderStatusRow,
    orderItemStatusRows,
    orderFulfillmentStatusRows,
    shipmentStatusRows,
    deliveredAtRows,
  } = statusResult;
  
  return cleanObject({
    order: orderStatusRow
      ? {
        id: orderStatusRow.id,
        statusId: orderStatusRow.order_status_id,
        statusDate: orderStatusRow.status_date,
      }
      : null,
    items: Array.isArray(orderItemStatusRows)
      ? orderItemStatusRows.map((item) => ({
        id: item.id,
        statusId: item.status_id,
        statusDate: item.status_date,
      }))
      : [],
    fulfillments: Array.isArray(orderFulfillmentStatusRows)
      ? orderFulfillmentStatusRows.map((id) => ({ id }))
      : [],
    shipment: Array.isArray(shipmentStatusRows)
      ? shipmentStatusRows.map((id) => ({ id }))
      : [],
    deliveredShipments: Array.isArray(deliveredAtRows)
      ? deliveredAtRows.map((d) => ({ id: d.id, deliveredAt: d.delivered_at }))
      : [],
    summary: {
      orderItemsCount:         orderItemStatusRows?.length        || 0,
      fulfillmentsCount:       orderFulfillmentStatusRows?.length || 0,
      shipmentCount:           shipmentStatusRows?.length         || 0,
      deliveredShipmentCount:  deliveredAtRows?.length            || 0,
    },
    meta: {
      updatedAt: new Date().toISOString(),
    },
  });
};

module.exports = {
  transformFulfillmentResult,
  transformAdjustedFulfillmentResult,
  transformPaginatedOutboundShipmentResults,
  transformShipmentDetailsRows,
  transformOutboundFulfillmentCompletionResult,
  transformOutboundShipmentForTrackingAttachRow,
  transformCreateTrackingNumbersResult,
  transformDeliveryConfirmationResult,
};
