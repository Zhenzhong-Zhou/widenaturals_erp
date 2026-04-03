/**
 * @file outbound-fulfillment-transformer.js
 * @description Transformers for outbound fulfillment and shipment records.
 *
 * Exports:
 *   - transformFulfillmentResult               – minimal result after initial fulfillment creation
 *   - transformAdjustedFulfillmentResult       – full result after fulfillment confirmation
 *   - transformPaginatedOutboundShipmentResults – paginated shipment list
 *   - transformShipmentDetailsRows             – grouped shipment detail with fulfillments and batches
 *   - transformPickupCompletionResult          – result after manual/pickup fulfillment completion
 *
 * Internal helpers (not exported):
 *   - transformOutboundShipmentRow – per-row transformer for paginated shipment list
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject }                  = require('../utils/object-utils');
const { getFullName }                  = require('../utils/person-utils');
const { transformPageResult }          = require('../utils/transformer-utils');
const { getProductDisplayName }        = require('../utils/display-name-utils');
const { formatPackagingMaterialLabel } = require('../utils/packaging-material-utils');

/**
 * Transforms the minimal result of an initial outbound fulfillment creation.
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {Object} params.shipmentRow
 * @param {Array}  params.fulfillmentRowsWithStatus
 * @param {Object} params.shipmentBatchRow
 * @param {Object} params.orderStatusRow
 * @param {Array}  params.orderItemStatusRow
 * @returns {Object}
 */
const transformFulfillmentResult = ({
                                      orderId,
                                      shipmentRow,
                                      fulfillmentRowsWithStatus,
                                      shipmentBatchRow,
                                      orderStatusRow,
                                      orderItemStatusRow,
                                    }) => {
  const fulfillmentRow = fulfillmentRowsWithStatus?.[0] ?? null;
  
  return cleanObject({
    orderId,
    orderStatus: {
      id:        orderStatusRow?.order_status_id ?? null,
      updatedAt: orderStatusRow?.status_date     ?? null,
    },
    shipment: {
      id:      shipmentRow?.id     ?? null,
      batchId: shipmentBatchRow?.id ?? null,
    },
    fulfillment: {
      id:       fulfillmentRow?.id        ?? null,
      statusId: fulfillmentRow?.status_id ?? null,
    },
    statusUpdates: {
      updatedOrderItemStatusIds: orderItemStatusRow?.map((row) => row.id) ?? [],
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
                                              orderItemStatusRow,
                                              inventoryAllocationStatusRow,
                                              orderFulfillmentStatusRow,
                                              shipmentStatusRow,
                                              logMetadata,
                                            }) => ({
  order: {
    id:     orderId,
    number: orderNumber,
  },
  shipment: {
    id:       shipmentId,
    statuses: shipmentStatusRow,
  },
  fulfillments: fulfillments.map((f) => ({
    id:       f.fulfillment_id,
    statusId: f.status_id,
  })),
  inventory: {
    updatedWarehouseIds: warehouseInventoryIds,
  },
  statuses: {
    order:        orderStatusRow,
    orderItems:   orderItemStatusRow,
    allocations:  inventoryAllocationStatusRow,
    fulfillments: orderFulfillmentStatusRow,
    shipments:    shipmentStatusRow,
  },
  logs: logMetadata,
});

/**
 * Transforms a single paginated outbound shipment DB row into the list view shape.
 *
 * @param {Object} row
 * @returns {Object}
 */
const transformOutboundShipmentRow = (row) =>
  cleanObject({
    shipmentId: row.shipment_id,
    order: {
      id:     row.order_id,
      number: row.order_number,
    },
    warehouse: {
      id:   row.warehouse_id,
      name: row.warehouse_name ?? null,
    },
    deliveryMethod: row.delivery_method
      ? { id: row.delivery_method_id, name: row.delivery_method }
      : null,
    trackingNumber: row.tracking_number
      ? { id: row.tracking_number_id, number: row.tracking_number }
      : null,
    status: {
      id:   row.status_id,
      code: row.status_code,
      name: row.status_name,
    },
    dates: {
      shippedAt:        row.shipped_at              ?? null,
      expectedDelivery: row.expected_delivery_date  ?? null,
    },
    notes:           row.notes           ?? null,
    shipmentDetails: row.shipment_details ?? null,
    audit: {
      createdAt: row.created_at,
      createdBy: {
        id:       row.created_by,
        fullName: getFullName(row.created_by_firstname, row.created_by_lastname),
      },
      updatedAt: row.updated_at,
      updatedBy: {
        id:       row.updated_by,
        fullName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
      },
    },
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
    orderId:    first.order_id,
    warehouse: {
      id:   first.warehouse_id,
      name: first.warehouse_name,
    },
    deliveryMethod: first.delivery_method_id
      ? {
        id:            first.delivery_method_id,
        name:          first.delivery_method_name,
        isPickup:      first.delivery_method_is_pickup,
        estimatedTime: first.delivery_method_estimated_time,
      }
      : null,
    status: {
      id:   first.shipment_status_id,
      code: first.shipment_status_code,
      name: first.shipment_status_name,
    },
    shippedAt:            first.shipped_at,
    expectedDeliveryDate: first.expected_delivery_date,
    notes:                first.shipment_notes,
    details:              first.shipment_details,
    audit: {
      createdAt: first.created_at,
      createdBy: {
        id:   first.created_by,
        name: getFullName(first.shipment_created_by_firstname, first.shipment_created_by_lastname),
      },
      updatedAt: first.updated_at,
      updatedBy: {
        id:   first.updated_by,
        name: getFullName(first.shipment_updated_by_firstname, first.shipment_updated_by_lastname),
      },
    },
    tracking: first.tracking_id
      ? {
        id:          first.tracking_id,
        number:      first.tracking_number,
        carrier:     first.carrier,
        serviceName: first.service_name,
        bolNumber:   first.bol_number,
        freightType: first.freight_type,
        notes:       first.tracking_notes,
        shippedDate: first.tracking_shipped_date,
        status: {
          id:   first.tracking_status_id,
          name: first.tracking_status_name,
        },
      }
      : null,
  };
  
  const fulfillmentsMap = new Map();
  
  for (const row of rows) {
    if (!row.fulfillment_id) continue;
    
    if (!fulfillmentsMap.has(row.fulfillment_id)) {
      fulfillmentsMap.set(row.fulfillment_id, {
        fulfillmentId:     row.fulfillment_id,
        quantityFulfilled: row.quantity_fulfilled,
        fulfilledAt:       row.fulfilled_at,
        notes:             row.fulfillment_notes,
        status: {
          id:   row.fulfillment_status_id,
          code: row.fulfillment_status_code,
          name: row.fulfillment_status_name,
        },
        audit: {
          createdAt: row.fulfillment_created_at,
          createdBy: {
            id:   row.fulfillment_created_by,
            name: getFullName(row.fulfillment_created_by_firstname, row.fulfillment_created_by_lastname),
          },
          updatedAt: row.fulfillment_updated_at,
          updatedBy: {
            id:   row.fulfillment_updated_by,
            name: getFullName(row.fulfillment_updated_by_firstname, row.fulfillment_updated_by_lastname),
          },
          fulfilledBy: row.fulfilled_by
            ? {
              id:   row.fulfilled_by,
              name: getFullName(row.fulfillment_fulfilled_by_firstname, row.fulfillment_fulfilled_by_lastname),
            }
            : null,
        },
        orderItem: row.order_item_id
          ? {
            id:              row.order_item_id,
            quantityOrdered: row.quantity_ordered,
            ...(row.sku_id && row.product_id
              ? {
                sku: {
                  id:       row.sku_id,
                  code:     row.sku,
                  barcode:  row.barcode,
                  sizeLabel: row.size_label,
                  region:   row.market_region,
                  product: {
                    id:       row.product_id,
                    name:     getProductDisplayName(row),
                    category: row.category,
                  },
                },
              }
              : row.packaging_material_id
                ? {
                  packagingMaterial: {
                    id:   row.packaging_material_id,
                    code: row.packaging_material_code,
                    label: row.material_snapshot_name ||
                      formatPackagingMaterialLabel({
                        name:      row.packaging_material_name,
                        size:      row.packaging_material_size,
                        color:     row.packaging_material_color,
                        unit:      row.packaging_material_unit,
                        length_cm: row.packaging_material_length_cm,
                        width_cm:  row.packaging_material_width_cm,
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
      
      const batch = {
        shipmentBatchId: row.shipment_batch_id,
        quantityShipped: row.quantity_shipped,
        notes:           row.shipment_batch_notes,
        audit: {
          createdAt: row.shipment_batch_created_at,
          createdBy: {
            id:   row.shipment_batch_created_by,
            name: getFullName(row.shipment_batch_created_by_firstname, row.shipment_batch_created_by_lastname),
          },
        },
        batchRegistryId: row.batch_registry_id,
        batchType:       row.batch_type,
      };
      
      if (row.batch_type === 'product') {
        Object.assign(batch, {
          lotNumber:  row.product_lot_number,
          expiryDate: row.product_expiry_date,
        });
      }
      
      if (row.batch_type === 'packaging_material') {
        Object.assign(batch, {
          lotNumber:  row.material_lot_number,
          expiryDate: row.material_expiry_date,
        });
      }
      
      fulfillment.batches.push(batch);
    }
  }
  
  return cleanObject({
    shipment:     header,
    fulfillments: Array.from(fulfillmentsMap.values()),
  });
};

/**
 * Transforms the result of a manual/pickup fulfillment completion.
 *
 * @param {Object} statusResult
 * @returns {Object}
 */
const transformPickupCompletionResult = (statusResult) => {
  if (!statusResult) return {};
  
  const {
    orderStatusRow,
    orderItemStatusRow,
    orderFulfillmentStatusRow,
    shipmentStatusRow,
  } = statusResult;
  
  return cleanObject({
    order: orderStatusRow
      ? {
        id:         orderStatusRow.id,
        statusId:   orderStatusRow.order_status_id,
        statusDate: orderStatusRow.status_date,
      }
      : null,
    items: Array.isArray(orderItemStatusRow)
      ? orderItemStatusRow.map((item) => ({
        id:         item.id,
        statusId:   item.status_id,
        statusDate: item.status_date,
      }))
      : [],
    fulfillments: Array.isArray(orderFulfillmentStatusRow)
      ? orderFulfillmentStatusRow.map((id) => ({ id }))
      : [],
    shipment: Array.isArray(shipmentStatusRow)
      ? shipmentStatusRow.map((id) => ({ id }))
      : [],
    summary: {
      orderItemsCount:    orderItemStatusRow?.length      || 0,
      fulfillmentsCount:  orderFulfillmentStatusRow?.length || 0,
      shipmentCount:      shipmentStatusRow?.length        || 0,
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
  transformPickupCompletionResult,
};
