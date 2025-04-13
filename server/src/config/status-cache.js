const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');

let statusMap = null;

const getStatusIdMap = async () => {
  const sql = `
    SELECT 'status' AS source, LOWER(name) AS name, id FROM status WHERE LOWER(name) IN ('active')
    UNION ALL
    SELECT 'warehouse_lot_status', LOWER(name), id FROM warehouse_lot_status WHERE LOWER(name) IN ('in_stock')
  `;
  const rows = await query(sql);
  
  const map = {};
  for (const row of rows) {
    if (row.source === 'status' && row.name === 'active') {
      map.product_active = row.id;
      map.warehouse_active = row.id;
    } else if (row.source === 'warehouse_lot_status' && row.name === 'in_stock') {
      map.lot_in_stock = row.id;
    }
  }
  return map;
};

const initStatusCache = async () => {
  try {
    statusMap = await getStatusIdMap();
  } catch (err) {
    logError('Failed to load status ID map:', err);
    throw err; // fail fast on startup
  }
};

const getStatusId = (key) => {
  if (!statusMap || !statusMap[key]) {
    throw new Error(`Missing status ID for key: ${key}`);
  }
  return statusMap[key];
};

module.exports = {
  initStatusCache,
  getStatusId,
};
