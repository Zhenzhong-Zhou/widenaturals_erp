/**
 * @fileoverview build-inventory-log-filters.js
 * Utility to dynamically construct SQL WHERE clauses and parameter arrays for filtering inventory activity logs.
 * Used in report repositories for paginated log queries.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');
const { toPgArray } = require('../query/query-utils');

/**
 * Builds a dynamic SQL WHERE clause and parameters array based on provided inventory activity log filters.
 *
 * - Handles both scalar and array-based filters.
 * - Uses `ANY()` syntax for array filters (e.g., warehouseIds, skuIds).
 * - Dynamically indexes positional parameters for safe binding in parameterized queries.
 * - Returns a SQL-ready `whereClause` string and a `params` array in order of appearance.
 * - Gracefully handles missing or empty filters.
 * - Wraps errors with logging and a standardized AppError for downstream handling.
 *
 * @param {Object} [filters={}] - Optional filters used to narrow inventory activity log queries.
 * @param {string[]} [filters.warehouseIds] - Array of warehouse UUIDs.
 * @param {string[]} [filters.locationIds] - Array of location UUIDs.
 * @param {string[]} [filters.productIds] - Array of product UUIDs.
 * @param {string[]} [filters.skuIds] - Array of SKU UUIDs.
 * @param {string[]} [filters.batchIds] - Array of batch registry UUIDs.
 * @param {string[]} [filters.packagingMaterialIds] - Array of packaging material UUIDs.
 * @param {string[]} [filters.actionTypeIds] - Array of inventory action type IDs.
 * @param {string}   [filters.orderId] - Filter by associated order ID.
 * @param {string}   [filters.statusId] - Filter by inventory status ID.
 * @param {string}   [filters.adjustmentTypeId] - Filter by adjustment type ID.
 * @param {string}   [filters.performedBy] - Filter by user ID who performed the action.
 * @param {string}   [filters.sourceType] - Filter by source type (e.g., 'transfer', 'return').
 * @param {string}   [filters.batchType] - Filter by batch type (e.g., 'product', 'packaging_material').
 * @param {string}   [filters.fromDate] - Start date (inclusive, ISO string).
 * @param {string}   [filters.toDate] - End date (inclusive, ISO string).
 *
 * @returns {{ whereClause: string, params: any[] }} An object containing the SQL WHERE clause and bound parameter values.
 *
 * @throws {AppError} Throws a transformer error if filter processing fails, with context and logging.
 */
const buildInventoryLogWhereClause = (filters = {}) => {
  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (filters.warehouseIds?.length) {
      conditions.push(`wi.warehouse_id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.warehouseIds));
    }
    
    if (filters.locationIds?.length) {
      conditions.push(`li.location_id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.locationIds));
    }
    
    if (filters.productIds?.length) {
      conditions.push(`p.id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.productIds));
    }
    
    if (filters.skuIds?.length) {
      conditions.push(`s.id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.skuIds));
    }
    
    if (filters.batchIds?.length) {
      conditions.push(`br.id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.batchIds));
    }
    
    if (filters.packagingMaterialIds?.length) {
      conditions.push(`pm.id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.packagingMaterialIds));
    }
    
    if (filters.actionTypeIds?.length) {
      conditions.push(`ial.inventory_action_type_id = ANY($${paramIndex++})`);
      params.push(toPgArray(filters.actionTypeIds));
    }
    
    if (filters.orderId) {
      conditions.push(`o.id = $${paramIndex++}`);
      params.push(filters.orderId);
    }
    
    if (filters.statusId) {
      conditions.push(`ial.status_id = $${paramIndex++}`);
      params.push(filters.statusId);
    }
    
    if (filters.adjustmentTypeId) {
      conditions.push(`ial.adjustment_type_id = $${paramIndex++}`);
      params.push(filters.adjustmentTypeId);
    }
    
    if (filters.performedBy) {
      conditions.push(`ial.performed_by = $${paramIndex++}`);
      params.push(filters.performedBy);
    }
    
    if (filters.sourceType) {
      conditions.push(`ial.source_type = $${paramIndex++}`);
      params.push(filters.sourceType);
    }
    
    if (filters.batchType) {
      conditions.push(`br.batch_type = $${paramIndex++}`);
      params.push(filters.batchType);
    }
    
    if (filters.fromDate) {
      conditions.push(`ial.action_timestamp >= $${paramIndex++}`);
      params.push(filters.fromDate);
    }
    
    if (filters.toDate) {
      conditions.push(`ial.action_timestamp <= $${paramIndex++}`);
      params.push(filters.toDate);
    }
    
    const whereClause = conditions.length ? `${conditions.join(' AND ')}` : '1=1';
    return { whereClause, params };
  } catch (err) {
    logSystemException(err, 'Error building inventory activity log filter WHERE clause', {
      context: 'report-repository/buildInventoryLogWhereClause',
      filters,
    });
    throw AppError.transformerError('Error building filter conditions for inventory log report', {
      details: err.message,
    });
  }
};

module.exports = {
  buildInventoryLogWhereClause,
};
