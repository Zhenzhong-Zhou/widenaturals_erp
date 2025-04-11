/**
 * Transforms a raw warehouse inventory lot row into a structured object.
 * Used after selecting a lot for inventory allocation.
 *
 * @param {object} row - Raw row from warehouse_inventory_lots query
 * @returns {{
 *   lot_id: string;
 *   inventory_id: string;
 *   warehouse_id: string;
 *   lot_number: string;
 *   quantity: number;
 *   expiry_date: string | null;
 *   inbound_date: string;
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
  };
};

module.exports = {
  transformWarehouseLotResult,
};
