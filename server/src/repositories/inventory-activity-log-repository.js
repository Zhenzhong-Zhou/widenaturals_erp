'use strict';

const { handleDbError } = require('../utils/errors/error-handlers');
const { logBulkInsertError } = require('../utils/db-logger');
const { bulkInsert } = require('../utils/db/write-utils');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { IAL_INSERT_COLUMNS } = require('./queries/inventory-activity-log-queries');

const CONTEXT = 'inventory-activity-log-repository';

/**
 * @param {object[]} logEntries
 * @param {string} logEntries[].warehouse_inventory_id
 * @param {string} logEntries[].inventory_action_type_id
 * @param {string} [logEntries[].adjustment_type_id]
 * @param {number} logEntries[].previous_quantity
 * @param {number} logEntries[].quantity_change
 * @param {number} logEntries[].new_quantity
 * @param {string} [logEntries[].status_id]
 * @param {string} [logEntries[].status_effective_at]
 * @param {string} [logEntries[].reference_type]
 * @param {string} [logEntries[].reference_id]
 * @param {string} logEntries[].performed_by
 * @param {string} [logEntries[].comments]
 * @param {string} logEntries[].checksum
 * @param {object} [logEntries[].metadata]
 * @param {string} [logEntries[].created_by]
 * @param {import('pg').PoolClient} client
 * @param {object} [meta]
 * @returns {Promise<object[]>}
 */
const insertInventoryActivityLogBulk = async (logEntries, client, meta = {}) => {
  if (!Array.isArray(logEntries) || logEntries.length === 0) return [];
  
  const context = `${CONTEXT}/insertInventoryActivityLogBulk`;
  
  const rows = logEntries.map((entry) => [
    entry.warehouse_inventory_id,
    entry.inventory_action_type_id,
    entry.adjustment_type_id       ?? null,
    entry.previous_quantity,
    entry.quantity_change,
    entry.new_quantity,
    entry.status_id                ?? null,
    entry.status_effective_at      ?? null,
    entry.reference_type           ?? null,
    entry.reference_id             ?? null,
    entry.performed_by,
    entry.comments                 ?? null,
    entry.checksum,
    entry.metadata                 ?? null,
    entry.created_by               ?? null,
  ]);
  
  validateBulkInsertRows(rows, IAL_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'inventory_activity_log',
      IAL_INSERT_COLUMNS,
      rows,
      [],           // no conflict — logs are append-only
      {},           // no update strategies
      client,
      { meta: { context, ...meta } },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert inventory activity log records.',
      meta:    { entryCount: logEntries.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'inventory_activity_log',
        rows,
        rows.length,
        { context }
      ),
    });
  }
};

module.exports = {
  insertInventoryActivityLogBulk,
};
