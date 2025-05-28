const { getProductDisplayName } = require('../utils/display-name-utils');
const { deriveInventoryStatusFlags } = require('../utils/transformer-utils');
const { cleanObject } = require('../utils/object-utils');

/**
 * @function transformInventoryRecordBase
 * @description
 * Transforms a raw inventory database row (from either `location_inventory` or `warehouse_inventory`)
 * into a structured, display-ready object. This function abstracts common transformation logic
 * for both product and packaging material items, including quantity calculations, derived status flags,
 * and conditional inclusion of lot and scope data.
 *
 * This base function is intended to be reused by both `transformLocationInventoryRecord` and
 * `transformWarehouseInventoryRecord` by supplying a scoped config to adapt the transformation.
 *
 * @param {Object} row - A single raw DB result row representing an inventory record
 * @param {Object} config - Configuration for adapting to the table-specific structure
 * @param {string} config.idField - The row field name used for the inventory record ID
 * @param {string} config.scopeKey - Either `"location"` or `"warehouse"` — the key for the scope object
 * @param {string} config.scopeIdField - Field name for the location or warehouse ID
 * @param {string} config.scopeNameField - Field name for the location or warehouse name
 * @param {string} [config.scopeTypeField] - Optional field name for location type (only for location inventory)
 * @param {string} config.quantityField - Field name for total quantity (`location_quantity` or `warehouse_quantity`)
 * @param {boolean} config.includeInboundOutboundDates - Whether to include inbound/outbound timestamps (location inventory only)
 *
 * @returns {Object} A cleaned, enriched inventory object ready for client display
 */
const transformInventoryRecordBase = (row, config) => {
  const itemType = row.item_type;
  const isProduct = itemType === 'product';
  const isMaterial = itemType === 'packaging_material';
  
  const displayName = isProduct
    ? getProductDisplayName(row)
    : row.material_name;
  
  const displayLotNumber = isProduct ? row.product_lot_number : row.material_lot_number;
  const displayManufactureDate = isProduct
    ? row.product_manufacture_date
    : row.material_manufacture_date;
  const displayExpiryDate = isProduct
    ? row.product_expiry_date
    : row.material_expiry_date;
  
  const totalQuantity = row[config.quantityField] ?? 0;
  const reservedQuantity = row.reserved_quantity ?? 0;
  const available = Math.max(totalQuantity - reservedQuantity, 0);
  
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
    ...(config.includeInboundOutboundDates && {
      inboundDate: row.inbound_date,
      outboundDate: row.outbound_date,
    }),
  });
  
  return cleanObject({
    id: row[config.idField],
    itemType,
    [config.scopeKey]: cleanObject({
      id: row[config.scopeIdField],
      name: row[config.scopeNameField],
      ...(config.scopeTypeField ? { type: row[config.scopeTypeField] } : {}),
    }),
    quantity: {
      [config.quantityField]: totalQuantity,
      reserved: reservedQuantity,
      available,
    },
    lot: {
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
        received_name: row.received_label_name,
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
    createdBy: row.created_by_firstname || row.created_by_lastname
      ? `${row.created_by_firstname ?? ''} ${row.created_by_lastname ?? ''}`.trim()
      : null,
    updatedBy: row.updated_by_firstname || row.updated_by_lastname
      ? `${row.updated_by_firstname ?? ''} ${row.updated_by_lastname ?? ''}`.trim()
      : null,
    status,
    timestamps,
    display: {
      name: displayName,
    },
  });
};

module.exports = { transformInventoryRecordBase };
