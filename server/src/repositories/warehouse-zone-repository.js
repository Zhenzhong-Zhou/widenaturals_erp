/**
 * @file warehouse-zone-repository.js
 * @description
 * Repository for warehouse zone lookups.
 *
 * Follows the established repo pattern:
 *  - Query constants imported from warehouse-zone-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getWarehouseZonesByInventoryId — fetch zone assignments for a warehouse inventory record
 */

'use strict';

const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { WAREHOUSE_ZONES_BY_INVENTORY_ID_QUERY } = require('./queries/warehouse-zone-queries');

const CONTEXT = 'warehouse-zone-repository';

/**
 * Fetches all zone assignments for a given warehouse inventory record.
 *
 * @param {string} inventoryId
 * @returns {Promise<WarehouseZoneRow[]>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getWarehouseZonesByInventoryId = async (inventoryId) => {
  const context = `${CONTEXT}/getWarehouseZonesByInventoryId`;
  const params = [inventoryId];
  
  try {
    const { rows } = await query(WAREHOUSE_ZONES_BY_INVENTORY_ID_QUERY, params);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse zones.',
      meta:    { inventoryId },
      logFn:   (err) => logDbQueryError(
        WAREHOUSE_ZONES_BY_INVENTORY_ID_QUERY, params, err, { context }
      ),
    });
  }
};

module.exports = {
  getWarehouseZonesByInventoryId,
};
