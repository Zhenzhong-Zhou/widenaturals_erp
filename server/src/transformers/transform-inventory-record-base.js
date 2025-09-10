const { getProductDisplayName } = require('../utils/display-name-utils');
const { deriveInventoryStatusFlags } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');

/**
 * @typedef {Object} InventoryRecordRow
 * @property {string} item_type
 * @property {string} [product_name]
 * @property {string} [brand_name]
 * @property {string} [sku_code]
 * @property {string} [barcode]
 * @property {string} [language]
 * @property {string} [country_code]
 * @property {string} [size_label]
 * @property {string} [product_manufacturer_name]
 * @property {string} [product_lot_number]
 * @property {string} [product_manufacture_date]
 * @property {string} [product_expiry_date]
 * @property {string} [material_name]
 * @property {string} [material_code]
 * @property {string} [material_color]
 * @property {string} [material_size]
 * @property {string} [material_unit]
 * @property {string} [material_supplier_name]
 * @property {string} [material_lot_number]
 * @property {string} [material_manufacture_date]
 * @property {string} [material_expiry_date]
 * @property {string} [received_label_name]
 * @property {string} [part_name]
 * @property {string} [part_code]
 * @property {string} [part_type]
 * @property {string} [part_unit]
 * @property {string} [status_name]
 * @property {number} [reserved_quantity]
 * @property {string} [batch_id]
 * @property {string} [location_id]
 * @property {string} [location_name]
 * @property {string} [location_type_name]
 * @property {string} [created_by_firstname]
 * @property {string} [created_by_lastname]
 * @property {string} [updated_by_firstname]
 * @property {string} [updated_by_lastname]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {string} [last_update]
 * @property {string} [inbound_date]
 * @property {string} [outbound_date]
 * @property {string} [status_date]
 * @property {number} [location_quantity]
 * @property {number} [warehouse_quantity]
 */

/**
 * @typedef {Object} TransformInventoryConfig
 * @property {string} idField
 * @property {string} scopeKey
 * @property {string} scopeIdField
 * @property {string} scopeNameField
 * @property {string} [scopeTypeField]
 * @property {string} quantityField
 * @property {boolean} [includeInboundOutboundDates]
 */

/**
 * @description
 * Transforms a raw inventory database row (from either `location_inventory` or `warehouse_inventory`)
 * into a structured, display-ready object. This function abstracts common transformation logic
 * for both product and packaging material items, including quantity calculations, derived status flags,
 * and conditional inclusion of lot and scope data.
 *
 * This base function is intended to be reused by both `transformLocationInventoryRecord` and
 * `transformWarehouseInventoryRecord` by supplying a scoped config to adapt the transformation.
 *
 * @param {InventoryRecordRow} row - A single raw DB result row representing an inventory record
 * @param {TransformInventoryConfig} config - Configuration for adapting to the table-specific structure
 * @returns {Object} A cleaned, enriched inventory object ready for client display
 */
const transformInventoryRecordBase = (row, config) => {
  const itemType = row.item_type;
  const isProduct = itemType === 'product';
  const isMaterial = itemType === 'packaging_material';

  const displayName = isProduct
    ? getProductDisplayName(row)
    : row.material_name;

  const displayLotNumber = isProduct
    ? row.product_lot_number
    : row.material_lot_number;
  const displayManufactureDate = isProduct
    ? row.product_manufacture_date
    : row.material_manufacture_date;
  const displayExpiryDate = isProduct
    ? row.product_expiry_date
    : row.material_expiry_date;

  const totalQuantity = row[config.quantityField] ?? 0;
  const reservedQuantity = row.reserved_quantity ?? 0;
  const available = Math.max(totalQuantity - reservedQuantity, 0);

  const camelQuantityKey = config.quantityField.replace(/_([a-z])/g, (_, g) =>
    g.toUpperCase()
  );

  const statusFlags = deriveInventoryStatusFlags({
    available_quantity: available,
    nearest_expiry_date: displayExpiryDate,
    earliest_manufacture_date: displayManufactureDate,
  });

  const status = cleanObject({
    name: row.status_name,
    stockLevel: statusFlags.stockLevel,
    expirySeverity: statusFlags.expirySeverity,
  });

  const timestamps = cleanObject({
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUpdate: row.last_update,
    inboundDate: row.inbound_date,
    outboundDate: row.outbound_date,
    statusDate: row.status_date,
  });

  return cleanObject({
    id: row[config.idField],
    itemType,
    [config.scopeKey]: cleanObject({
      id: row[config.scopeIdField],
      name: row[config.scopeNameField],
      ...(config.scopeTypeField ? { type: row[config.scopeTypeField] } : {}),
    }),
    location: row.location_id
      ? {
        id: row.location_id,
        name: row.location_name,
        type: row.location_type_name,
      }
      : null,
    quantity: {
      [camelQuantityKey]: totalQuantity,
      reserved: reservedQuantity,
      available,
    },
    lot: {
      batchId: row.batch_id,
      batchType: row.item_type,
      number: displayLotNumber,
      manufactureDate: displayManufactureDate,
      expiryDate: displayExpiryDate,
    },
    product: isProduct
      ? {
          name: row.product_name,
          brand: row.brand_name,
          sku: row.sku_code,
          barcode: row.barcode,
          language: row.language,
          countryCode: row.country_code,
          sizeLabel: row.size_label,
          manufacturer: row.product_manufacturer_name,
        }
      : undefined,
    material: isMaterial
      ? {
          name: row.material_name,
          receivedName: row.received_label_name,
          code: row.material_code,
          color: row.material_color,
          size: row.material_size,
          unit: row.material_unit,
          supplier: row.material_supplier_name,
        }
      : undefined,
    part: row.part_name
      ? {
          name: row.part_name,
          code: row.part_code,
          type: row.part_type,
          unit: row.part_unit,
        }
      : undefined,
    createdBy:
      row.created_by_firstname || row.created_by_lastname
        ? `${row.created_by_firstname ?? ''} ${row.created_by_lastname ?? ''}`.trim()
        : null,
    updatedBy:
      row.updated_by_firstname || row.updated_by_lastname
        ? `${row.updated_by_firstname ?? ''} ${row.updated_by_lastname ?? ''}`.trim()
        : null,
    status,
    timestamps,
    display: {
      name: displayName,
    },
  });
};

/**
 * Transforms raw inventory records into a lightweight, normalized summary format.
 *
 * Designed for post-insert or post-adjustment responses, this function merges key product
 * or material info into a unified shape. It supports dynamic configuration for warehouse
 * or location inventory and strips out null/undefined fields for a cleaner API/UI response.
 *
 * @param {Array<Object>} rows - Raw inventory records returned from SQL queries.
 * @param {Object} config - Configuration object.
 * @param {string} config.quantityField - Field name representing the quantity in the row (e.g. 'warehouse_quantity' or 'location_quantity').
 * @param {Function} config.getProductDisplayName - Function to generate a formatted product display name from the row.
 * @param {Function} config.cleanObject - Function to remove null/undefined values from the returned object.
 * @returns {Array<Object>} - Transformed and cleaned inventory summary records.
 */
const transformInventoryRecordSummaryBase = (rows, config) => {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const base = {
      id: row.id,
      quantity: row[config.quantityField],
      reserved: row.reserved_quantity,
      batchType: row.batch_type,
      itemType: row.batch_type,
    };

    const itemInfo =
      row.batch_type === 'product'
        ? {
            lotNumber: row.product_lot_number,
            expiryDate: row.product_expiry_date,
            name: config.getProductDisplayName(row),
          }
        : row.batch_type === 'packaging_material'
          ? {
              lotNumber: row.material_lot_number,
              expiryDate: row.material_expiry_date,
              name: row.material_name,
            }
          : {};

    return config.cleanObject({ ...base, ...itemInfo });
  });
};

module.exports = {
  transformInventoryRecordBase,
  transformInventoryRecordSummaryBase,
};
