const { cleanObject } = require('../utils/object-utils');
const { getFullName } = require('../utils/name-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { logSystemInfo } = require('../utils/system-logger');
const { formatPackagingMaterialLabel } = require('../utils/packaging-material-utils');

/**
 * Transforms raw DB rows into a normalized fulfillment result object.
 *
 * Business rules:
 *  - Combines order, shipment, fulfillment, and status update metadata into
 *    a clean DTO for outbound fulfillment responses.
 *  - Excludes inventory/log metadata (handled separately in adjustment flows).
 *
 * Usage:
 *  - Call at the end of `fulfillOutboundShipmentService` after DB inserts/updates.
 *  - Provides a minimal but structured response to the client or service layer.
 *
 * Performance:
 *  - O(n) where n = number of order item status rows.
 *  - Optimized: single-pass mapping for order item IDs.
 *
 * @function
 * @param {Object} params - Input payload for transformation
 * @param {string} params.orderId - Order ID
 * @param {Object} params.shipmentRow - Inserted shipment row
 * @param {Object} params.fulfillmentRowWithStatus - Inserted fulfillment row
 * @param {Object} params.shipmentBatchRow - Inserted shipment batch row
 * @param {Object} params.orderStatusRow - Updated order status row
 * @param {Object[]} params.orderItemStatusRow - Updated order item status rows
 * @returns {Object} Fulfillment result object:
 *  - {string} orderId
 *  - {Object} orderStatus { id, updatedAt }
 *  - {Object} shipment { id, batchId }
 *  - {Object} fulfillment { id, statusId }
 *  - {Object} statusUpdates { updatedOrderItemStatusIds }
 */
const transformFulfillmentResult = ({
                                      orderId,
                                      shipmentRow,
                                      fulfillmentRowWithStatus,
                                      shipmentBatchRow,
                                      orderStatusRow,
                                      orderItemStatusRow,
                                    }) => {
  const result = {
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
      id: fulfillmentRowWithStatus?.id ?? null,
      statusId: fulfillmentRowWithStatus?.status_id ?? null,
    },
    statusUpdates: {
      updatedOrderItemStatusIds: orderItemStatusRow?.map(row => row.id) ?? [],
    },
  };
  
  return cleanObject(result);
};

/**
 * Transforms raw fulfillment adjustment data into a structured result object.
 *
 * Business rules:
 *  - Provides a consolidated DTO containing order, shipment, fulfillment,
 *    inventory, and status update metadata after an adjustment.
 *  - Ensures logs and all related status transitions are returned together
 *    for traceability and auditing.
 *
 * Usage:
 *  - Call at the end of `adjustInventoryForFulfillmentService` after all
 *    inventory updates, status updates, and logs have been committed.
 *  - Intended to be returned as the service response.
 *
 * Performance:
 *  - O(n) where n = number of fulfillment records mapped.
 *  - Minimal overhead: simple object construction and array mapping.
 *
 * @function
 * @param {Object} params - Input payload for transformation
 * @param {string} params.orderId - ID of the order
 * @param {string} params.orderNumber - Human-readable order number
 * @param {Object[]} params.fulfillments - Fulfillment rows from DB
 * @param {string} params.shipmentId - ID of the outbound shipment
 * @param {string[]} params.warehouseInventoryIds - IDs of updated warehouse inventory records
 * @param {Object} params.orderStatusRow - Updated order status row
 * @param {Object[]} params.orderItemStatusRow - Updated order item status rows
 * @param {Object[]} params.inventoryAllocationStatusRow - Updated allocation status rows
 * @param {Object[]} params.orderFulfillmentStatusRow - Updated fulfillment status rows
 * @param {Object[]} params.shipmentStatusRow - Updated shipment status rows
 * @param {Object[]} params.logMetadata - Inserted inventory activity log metadata
 * @returns {Object} Structured fulfillment adjustment result:
 *  - {Object} order { id, number }
 *  - {Object} shipment { id, statuses }
 *  - {Object[]} fulfillments { id, statusId }
 *  - {Object} inventory { updatedWarehouseIds }
 *  - {Object} statuses { order, orderItems, allocations, fulfillments, shipments }
 *  - {Object[]} logs
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
                                            }) => {
  return {
    order: {
      id: orderId,
      number: orderNumber,
    },
    shipment: {
      id: shipmentId,
      statuses: shipmentStatusRow,
    },
    fulfillments: fulfillments.map(f => ({
      id: f.fulfillment_id,
      statusId: f.status_id,
    })),
    inventory: {
      updatedWarehouseIds: warehouseInventoryIds,
    },
    statuses: {
      order: orderStatusRow,
      orderItems: orderItemStatusRow,
      allocations: inventoryAllocationStatusRow,
      fulfillments: orderFulfillmentStatusRow,
      shipments: shipmentStatusRow,
    },
    logs: logMetadata,
  };
};

/**
 * Transforms a single raw outbound shipment SQL row into a clean, API-ready object.
 *
 * ### Input
 * A flat SQL row returned from `getPaginatedOutboundShipmentRecords`, containing:
 * - Shipment-level fields (id, status, notes, shipment_details, dates)
 * - Order-level fields (order_id, order_number)
 * - Warehouse info (warehouse_id, warehouse_name)
 * - Delivery method and tracking number (joined metadata)
 * - Audit fields (created/updated timestamps and usernames)
 *
 * ### Output
 * A normalized object with nested structures for:
 * - `shipmentId`
 * - `order` → `{ id, number }`
 * - `warehouse` → `{ id, name }`
 * - `deliveryMethod` → `{ id, name } | null`
 * - `trackingNumber` → `{ id, number } | null`
 * - `status` → `{ id, code, name }`
 * - `dates` → `{ shippedAt, expectedDelivery }`
 * - `notes` and `shipmentDetails`
 * - `audit` → `{ createdAt, createdBy, updatedAt, updatedBy }`
 *
 * @param {Record<string, any>} row - Raw SQL row object
 * @returns {Record<string, any>} Clean API-ready outbound shipment object
 */
const transformOutboundShipmentRow = (row) => {
  const base = {
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
      }
      : null,
    trackingNumber: row.tracking_number
      ? {
        id: row.tracking_number_id,
        number: row.tracking_number,
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
    shipmentDetails: row.shipment_details ?? null, // JSONB
    audit: {
      createdAt: row.created_at,
      createdBy: {
        id: row.created_by,
        fullName: getFullName(row.created_by_firstname, row.created_by_lastname),
      },
      updatedAt: row.updated_at,
      updatedBy: {
        id: row.updated_by,
        fullName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
      },
    },
  };
  
  return cleanObject(base);
};

/**
 * Transforms a paginated set of outbound shipment rows into API-ready format.
 *
 * Wraps `transformOutboundShipmentRow` for each row and preserves pagination metadata.
 *
 * ### Input
 * - `paginatedResult` → `{ data: SQLRow[], pagination: { page, limit, totalRecords, totalPages } }`
 *
 * ### Output
 * - `{ data: TransformedOutboundShipment[], pagination }`
 *
 * @param {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} paginatedResult - The raw paginated result from the repository
 * @returns {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} Cleaned paginated outbound shipment results
 */
const transformPaginatedOutboundShipmentResults = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformOutboundShipmentRow(row)
  );
};

/**
 * @typedef {Object} ShipmentDetailRow
 *
 * --- Shipment ---
 * @property {string} shipment_id - UUID of the outbound shipment
 * @property {string} order_id - UUID of the parent order
 * @property {string} warehouse_id - UUID of the warehouse where shipment originates
 * @property {string} warehouse_name - Name of the warehouse
 * @property {string|null} delivery_method_id - UUID of the delivery method
 * @property {string|null} delivery_method_name - Human-readable delivery method name
 * @property {boolean|null} delivery_method_is_pickup - Whether this delivery method is pickup
 * @property {string|object|null} delivery_method_estimated_time - Estimated time (string or structured JSON)
 * @property {string} shipment_status_id - UUID of the shipment status
 * @property {string} shipment_status_code - Code of the shipment status (e.g. SHIP_PENDING)
 * @property {string} shipment_status_name - Human-readable shipment status
 * @property {string|null} shipped_at - Timestamp when shipment was shipped (nullable)
 * @property {string|null} expected_delivery_date - Estimated delivery date
 * @property {string|null} shipment_notes - Internal notes attached to the shipment
 * @property {string|null} shipment_details - Extra structured details (JSON or text)
 * @property {string} created_at - Timestamp shipment created
 * @property {string|null} created_by - UUID of user who created the shipment
 * @property {string|null} shipment_created_by_firstname
 * @property {string|null} shipment_created_by_lastname
 * @property {string|null} updated_at - Timestamp shipment last updated
 * @property {string|null} updated_by - UUID of user who last updated
 * @property {string|null} shipment_updated_by_firstname
 * @property {string|null} shipment_updated_by_lastname
 *
 * --- Tracking ---
 * @property {string|null} tracking_id - UUID of the tracking record
 * @property {string|null} tracking_number - Tracking number from carrier
 * @property {string|null} carrier - Carrier name (FedEx, UPS, etc.)
 * @property {string|null} service_name - Carrier service (e.g. "Overnight")
 * @property {string|null} bol_number - Bill of Lading number (if freight)
 * @property {string|null} freight_type - Freight type (e.g. LTL, FTL, Air)
 * @property {string|null} tracking_notes - Notes from tracking record
 * @property {string|null} tracking_shipped_date - Date shipped (from carrier/tracking)
 * @property {string|null} tracking_status_id - UUID of tracking status
 * @property {string|null} tracking_status_name - Human-readable tracking status
 *
 * --- Fulfillment ---
 * @property {string|null} fulfillment_id - UUID of the fulfillment record
 * @property {number|null} quantity_fulfilled - Quantity fulfilled in this fulfillment
 * @property {string|null} fulfilled_at - Timestamp when fulfillment occurred
 * @property {string|null} fulfillment_notes - Notes for this fulfillment
 * @property {string|null} fulfillment_status_id - UUID of fulfillment status
 * @property {string|null} fulfillment_status_code - Code of fulfillment status
 * @property {string|null} fulfillment_status_name - Human-readable fulfillment status
 * @property {string|null} fulfillment_created_at - Fulfillment creation timestamp
 * @property {string|null} fulfillment_created_by - UUID of user who created
 * @property {string|null} fulfillment_created_by_firstname
 * @property {string|null} fulfillment_created_by_lastname
 * @property {string|null} fulfillment_updated_at - Fulfillment update timestamp
 * @property {string|null} fulfillment_updated_by - UUID of user who updated
 * @property {string|null} fulfillment_updated_by_firstname
 * @property {string|null} fulfillment_updated_by_lastname
 * @property {string|null} fulfilled_by - UUID of user who performed fulfillment
 * @property {string|null} fulfillment_fulfilled_by_firstname
 * @property {string|null} fulfillment_fulfilled_by_lastname
 *
 * --- Order Item ---
 * @property {string|null} order_item_id - UUID of the related order item
 * @property {number|null} quantity_ordered - Quantity originally ordered
 *
 * --- SKU/Product ---
 * @property {string|null} sku_id - UUID of SKU (if product item)
 * @property {string|null} sku - SKU code
 * @property {string|null} barcode - Barcode (UPC/EAN/GTIN)
 * @property {string|null} country_code - Country code associated with SKU
 * @property {string|null} size_label - Size/format label (e.g. "60 capsules")
 * @property {string|null} market_region - Market region (e.g. "US", "CA", "EU")
 * @property {string|null} product_id - UUID of product
 * @property {string|null} product_name - Product display name
 * @property {string|null} brand - Product brand
 * @property {string|null} series - Product series
 * @property {string|null} category - Product category
 *
 * --- Packaging Material ---
 * @property {string|null} packaging_material_id - UUID of packaging material (if packaging item)
 * @property {string|null} packaging_material_code - Internal code for packaging material
 * @property {string|null} packaging_material_name - Name of packaging material
 * @property {string|null} packaging_material_color - Color of packaging material
 * @property {string|null} packaging_material_size - Size description (if available)
 * @property {string|null} packaging_material_unit - Unit of measure (e.g. pcs)
 * @property {number|null} packaging_material_length_cm - Length in cm
 * @property {number|null} packaging_material_width_cm - Width in cm
 * @property {number|null} packaging_material_height_cm - Height in cm
 *
 * --- Shipment Batch ---
 * @property {string|null} shipment_batch_id - UUID of shipment batch record
 * @property {number|null} quantity_shipped - Quantity shipped from this batch
 * @property {string|null} shipment_batch_notes - Notes on this shipment batch
 * @property {string|null} shipment_batch_created_at - Timestamp batch created
 * @property {string|null} shipment_batch_created_by - UUID of batch creator
 * @property {string|null} shipment_batch_created_by_firstname
 * @property {string|null} shipment_batch_created_by_lastname
 * @property {string|null} batch_registry_id - UUID of batch registry record
 * @property {string} batch_type - Type of batch ("product" or "packaging_material")
 *
 * --- Product Batch ---
 * @property {string|null} product_lot_number - Lot number for product batches
 * @property {string|null} product_expiry_date - Expiry date for product batches
 *
 * --- Packaging Material Batch ---
 * @property {string|null} packaging_material_batch_id - UUID of packaging material batch
 * @property {string|null} material_lot_number - Lot number for packaging material batch
 * @property {string|null} material_expiry_date - Expiry date for packaging material batch
 * @property {string|null} material_snapshot_name - Snapshot name stored with packaging batch
 * @property {string|null} received_label_name - Label recorded at receipt for packaging batch
 */

/**
 * Transform flat shipment rows (from `getShipmentDetailsById`) into nested shipment details.
 *
 * Groups:
 *  - One shipment header (status, warehouse, notes, tracking info)
 *  - Fulfillments[] (each with order item, SKU/product OR packaging material)
 *  - Each fulfillment may contain multiple batches[] (product batch or packaging material batch)
 *
 * @param {ShipmentDetailRow[]} rows - Raw rows returned by SQL query
 * @returns {{
 *   shipment: Object,
 *   fulfillments: Array<Object>
 * } | null} Nested shipment details or null if no rows
 *
 * @example
 * {
 *   shipment: {
 *     shipmentId: "uuid",
 *     orderId: "uuid",
 *     warehouse: { id: "uuid", name: "Main WH" },
 *     status: { id: "uuid", code: "SHIP_PENDING", name: "Pending" },
 *     tracking: { id: "uuid", number: "123456", carrier: "FedEx" }
 *   },
 *   fulfillments: [
 *     {
 *       fulfillmentId: "uuid",
 *       status: { code: "FULFILLED" },
 *       orderItem: { id: "uuid", sku: {...} },
 *       batches: [
 *         { shipmentBatchId: "uuid", lotNumber: "LOT-2025", expiryDate: "2027-05-31" }
 *       ]
 *     }
 *   ]
 * }
 */
const transformShipmentDetailsRows = (rows) => {
  if (!rows || !rows.length) return null;
  
  // --- Shipment header ---
  const header = {
    shipmentId: rows[0].shipment_id,
    orderId: rows[0].order_id,
    warehouse: {
      id: rows[0].warehouse_id,
      name: rows[0].warehouse_name,
    },
    deliveryMethod: rows[0].delivery_method_id
      ? {
        id: rows[0].delivery_method_id,
        name: rows[0].delivery_method_name,
        isPickup: rows[0].delivery_method_is_pickup,
        estimatedTime: rows[0].delivery_method_estimated_time,
      }
      : null,
    status: {
      id: rows[0].shipment_status_id,
      code: rows[0].shipment_status_code,
      name: rows[0].shipment_status_name,
    },
    shippedAt: rows[0].shipped_at,
    expectedDeliveryDate: rows[0].expected_delivery_date,
    notes: rows[0].shipment_notes,
    details: rows[0].shipment_details,
    audit: {
      createdAt: rows[0].created_at,
      createdBy: {
        id: rows[0].created_by,
        name: getFullName(rows[0].shipment_created_by_firstname, rows[0].shipment_created_by_lastname),
      },
      updatedAt: rows[0].updated_at,
      updatedBy: {
        id: rows[0].updated_by,
        name: getFullName(rows[0].shipment_updated_by_firstname, rows[0].shipment_updated_by_lastname),
      },
    },
    tracking: rows[0].tracking_id
      ? {
        id: rows[0].tracking_id,
        number: rows[0].tracking_number,
        carrier: rows[0].carrier,
        serviceName: rows[0].service_name,
        bolNumber: rows[0].bol_number,
        freightType: rows[0].freight_type,
        notes: rows[0].tracking_notes,
        shippedDate: rows[0].tracking_shipped_date,
        status: {
          id: rows[0].tracking_status_id,
          name: rows[0].tracking_status_name,
        },
      }
      : null,
  };
  
  // --- Fulfillments ---
  const fulfillmentsMap = new Map();
  
  rows.forEach((row) => {
    if (!row.fulfillment_id) return;
    
    if (!fulfillmentsMap.has(row.fulfillment_id)) {
      fulfillmentsMap.set(row.fulfillment_id, {
        fulfillmentId: row.fulfillment_id,
        quantityFulfilled: row.quantity_fulfilled,
        fulfilledAt: row.fulfilled_at,
        notes: row.fulfillment_notes,
        status: {
          id: row.fulfillment_status_id,
          code: row.fulfillment_status_code,
          name: row.fulfillment_status_name,
        },
        audit: {
          createdAt: row.fulfillment_created_at,
          createdBy: {
            id: row.fulfillment_created_by,
            name: getFullName(row.fulfillment_created_by_firstname, row.fulfillment_created_by_lastname),
          },
          updatedAt: row.fulfillment_updated_at,
          updatedBy: {
            id: row.fulfillment_updated_by,
            name: getFullName(row.fulfillment_updated_by_firstname, row.fulfillment_updated_by_lastname),
          },
          fulfilledBy: row.fulfilled_by
            ? {
              id: row.fulfilled_by,
              name: getFullName(row.fulfillment_fulfilled_by_firstname, row.fulfillment_fulfilled_by_lastname),
            }
            : null,
        },
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
      
      const batch = {
        shipmentBatchId: row.shipment_batch_id,
        quantityShipped: row.quantity_shipped,
        notes: row.shipment_batch_notes,
        audit: {
          createdAt: row.shipment_batch_created_at,
          createdBy: {
            id: row.shipment_batch_created_by,
            name: getFullName(row.shipment_batch_created_by_firstname, row.shipment_batch_created_by_lastname),
          },
        },
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
  });
  
  logSystemInfo('Transformed shipment detail rows', {
    shipmentId: rows[0].shipment_id,
    fulfillmentCount: fulfillmentsMap.size,
    batchCount: rows.filter(r => r.shipment_batch_id).length,
  });
  
  return cleanObject({
    shipment: header,
    fulfillments: Array.from(fulfillmentsMap.values()),
  });
};

/**
 * @function
 * @description
 * Transforms the raw status update results from `updateAllStatuses`
 * into a structured and human-readable response for pickup completion.
 *
 * This is a pure transformer with no side effects or external dependencies.
 * It should be invoked within the service layer after transactional updates.
 *
 * @param {Object} statusResult - Raw result object from updateAllStatuses
 * @returns {Object} Transformed response for pickup completion
 *
 * @example
 * const transformed = transformPickupCompletionResult({
 *   orderStatusRow,
 *   orderItemStatusRow,
 *   orderFulfillmentStatusRow,
 *   shipmentStatusRow,
 * });
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
        id: orderStatusRow.id,
        statusId: orderStatusRow.order_status_id,
        statusDate: orderStatusRow.status_date,
      }
      : null,
    items: Array.isArray(orderItemStatusRow)
      ? orderItemStatusRow.map((item) => ({
        id: item.id,
        statusId: item.status_id,
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
      orderItemsCount: orderItemStatusRow?.length || 0,
      fulfillmentsCount: orderFulfillmentStatusRow?.length || 0,
      shipmentCount: shipmentStatusRow?.length || 0,
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
