/**
 * Transforms a raw warehouse inventory lot row into a structured object.
 * Includes display name: uses product name if available, falls back to inventory identifier.
 *
 * @param {object} row - Raw row from warehouse_inventory_lots query
 * @returns {{
 *   warehouse_inventory_lot_id: string;
 *   inventory_id: string;
 *   warehouse_id: string;
 *   lot_number: string;
 *   quantity: number;
 *   expiry_date: string | null;
 *   inbound_date: string;
 *   item_name: string;
 * }}
 */
const transformWarehouseLotResult = (row) => {
  if (!row) return null;
  
  return {
    warehouse_inventory_lot_id: row.id,
    inventory_id: row.inventory_id,
    warehouse_id: row.warehouse_id,
    lot_number: row.lot_number,
    quantity: Number(row.quantity),
    expiry_date: row.expiry_date ?? null,
    inbound_date: row.inbound_date,
    item_name: row.product_name || row.inventory_identifier || 'Unnamed Item',
  };
};

/**
 * Transform a raw inventory lot record into a normalized shape for client use.
 *
 * @param {Object} row - Raw DB row from lookupAvailableInventoryLots.
 * @returns {Object} Transformed inventory lot object.
 */
const transformInventoryLot = (row) => {
  const available = Number(row.available_quantity) || 0;
  const reserved = Number(row.reserved_quantity) || 0;
  const quantity = Number(row.quantity) || 0;
  
  const hasProductName = row.product_name?.trim();
  const hasIdentifier = row.inventory_identifier?.trim();
  
  let itemName = 'N/A';
  if (hasProductName && hasIdentifier) {
    itemName = `${row.product_name} (${row.inventory_identifier})`;
  } else if (hasProductName) {
    itemName = row.product_name;
  } else if (hasIdentifier) {
    itemName = row.inventory_identifier;
  }
  
  return {
    lotId: row.id,
    lotNumber: row.lot_number,
    inboundDate: row.inbound_date,
    manufactureDate: row.manufacture_date,
    expiryDate: row.expiry_date,
    lotQuantity: quantity,
    reservedQuantity: reserved,
    availableQuantity: available,
    inventoryId: row.inventory_id,
    itemName, // ← Combined fallback name
    warehouseId: row.warehouse_id,
    warehouseName: row.warehouse_name,
    status: available <= 0 ? 'out_of_stock' : 'in_stock',
    isNearExpiry:
      row.expiry_date && new Date(row.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
};

/**
 * Transform an array of inventory lots.
 *
 * @param {Array<Object>} rows - Array of raw DB rows.
 * @returns {Array<Object>} Transformed lots.
 */
const transformInventoryLots = (rows) => {
  return rows.map(transformInventoryLot);
};

module.exports = {
  transformWarehouseLotResult,
  transformInventoryLot,
  transformInventoryLots,
};
