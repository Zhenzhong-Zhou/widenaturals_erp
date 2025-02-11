const { query, withTransaction } = require('../database/db');
const { insertWarehouseLotAdjustment } = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

const getActionTypeId = async (client, actionTypeName) => {
  const { rows } = await client.query(
    `SELECT id FROM inventory_action_types WHERE name = $1 LIMIT 1;`,
    [actionTypeName]
  );
  
  if (rows.length === 0) {
    throw new Error(`Inventory action type "${actionTypeName}" not found.`);
  }
  
  return rows[0].id;
};

module.exports = {
  getActionTypeId,
};
