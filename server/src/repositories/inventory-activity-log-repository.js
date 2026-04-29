/**
 * @file inventory-activity-log-repository.js
 * @description Database access layer for inventory activity log records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from inventory-activity-log-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertInventoryActivityLogBulk   — append-only bulk insert of activity log entries
 *  - getPaginatedInventoryActivityLog — paginated activity log scoped to a warehouse
 */

'use strict';

const { handleDbError } = require('../utils/errors/error-handlers');
const { logBulkInsertError, logDbQueryError } = require('../utils/db-logger');
const { bulkInsert } = require('../utils/db/write-utils');
const {
  validateBulkInsertRows,
} = require('../utils/validation/bulk-insert-row-validator');
const {
  INVENTORY_ACTIVITY_LOG_INSERT_COLUMNS,
  buildInventoryActivityLogPaginatedQuery,
  INVENTORY_ACTIVITY_LOG_TABLE,
  INVENTORY_ACTIVITY_LOG_JOINS,
  INVENTORY_ACTIVITY_LOG_SORT_WHITELIST,
} = require('./queries/inventory-activity-log-queries');
const {
  buildInventoryActivityLogFilter,
} = require('../utils/sql/build-inventory-activity-log-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');

const CONTEXT = 'inventory-activity-log-repository';

/**
 * Bulk inserts inventory activity log entries.
 * Logs are append-only — no conflict resolution is applied.
 *
 * @param {InventoryActivityLogEntry[]} logEntries
 * @param {PoolClient}     client
 * @param {object}                      [meta={}]
 * @returns {Promise<{ id: string }[]>}
 * @throws {AppError} Normalized database error if the insert fails.
 */
const insertInventoryActivityLogBulk = async (
  logEntries,
  client,
  meta = {}
) => {
  if (!Array.isArray(logEntries) || logEntries.length === 0) return [];

  const context = `${CONTEXT}/insertInventoryActivityLogBulk`;

  const rows = logEntries.map((entry) => [
    entry.warehouse_inventory_id,
    entry.inventory_action_type_id,
    entry.adjustment_type_id ?? null,
    entry.previous_quantity,
    entry.quantity_change,
    entry.new_quantity,
    entry.status_id ?? null,
    entry.status_effective_at ?? null,
    entry.reference_type ?? null,
    entry.reference_id ?? null,
    entry.performed_by,
    entry.comments ?? null,
    entry.checksum,
    entry.metadata ?? null,
    entry.created_by ?? null,
  ]);

  validateBulkInsertRows(rows, INVENTORY_ACTIVITY_LOG_INSERT_COLUMNS.length);

  try {
    return await bulkInsert(
      'inventory_activity_log',
      INVENTORY_ACTIVITY_LOG_INSERT_COLUMNS,
      rows,
      [], // no conflict — logs are append-only
      {}, // no update strategies
      client,
      { meta: { context, ...meta } },
      'id'
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert inventory activity log records.',
      meta: { entryCount: logEntries.length },
      logFn: (err) =>
        logBulkInsertError(err, 'inventory_activity_log', rows, rows.length, {
          context,
        }),
    });
  }
};

/**
 * Fetches a paginated list of inventory activity log entries
 * scoped to a warehouse, with optional filters for inventory record,
 * action type, performer, and date range.
 *
 * @param {InventoryActivityLogFilters} filters
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @param {string} [sortBy='performedAt']
 * @param {string} [sortOrder='DESC']
 * @returns {Promise<PaginatedResult<InventoryActivityLogRow>>}
 * @throws {AppError} Normalized database error if the query fails.
 */
const getPaginatedInventoryActivityLog = async ({
  filters = {},
  page = 1,
  limit = 20,
  sortBy = 'performedAt',
  sortOrder = 'DESC',
}) => {
  const context = `${CONTEXT}/getPaginatedInventoryActivityLog`;

  const { whereClause, params } = buildInventoryActivityLogFilter(filters);

  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey: 'inventoryActivityLogSortMap',
    defaultSort: SORTABLE_FIELDS.inventoryActivityLogSortMap.defaultNaturalSort,
  });

  const queryText = buildInventoryActivityLogPaginatedQuery(whereClause);

  try {
    return await paginateQuery({
      tableName: INVENTORY_ACTIVITY_LOG_TABLE,
      joins: INVENTORY_ACTIVITY_LOG_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
      whitelistSet: INVENTORY_ACTIVITY_LOG_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated inventory activity log.',
      meta: { filters, page, limit, sortBy, sortOrder },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          page,
          limit,
        }),
    });
  }
};

module.exports = {
  insertInventoryActivityLogBulk,
  getPaginatedInventoryActivityLog,
};
