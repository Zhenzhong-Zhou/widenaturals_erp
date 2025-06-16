/**
 * @fileoverview build-inventory-log-filters.js
 * Utility to dynamically construct SQL WHERE clauses and parameter arrays for filtering inventory activity logs.
 * Used in report repositories for paginated log queries.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a dynamic SQL WHERE clause and parameter array for filtering inventory activity logs.
 *
 * Supports both singular and array-based filters using PostgreSQL's `ANY()` operator.
 *
 * @param {Object} filters - Optional filters to apply.
 * @param {string[]} [filters.warehouseIds] - Array of warehouse IDs.
 * @param {string[]} [filters.locationIds] - Array of location IDs.
 * @param {string[]} [filters.productIds] - Array of product IDs.
 * @param {string[]} [filters.skuIds] - Array of SKU IDs.
 * @param {string[]} [filters.batchIds] - Array of batch registry IDs.
 * @param {string}   [filters.orderId] - Order ID to filter logs.
 * @param {string}   [filters.statusId] - Inventory status ID.
 * @param {string[]} [filters.actionTypeIds] - Array of inventory action type IDs.
 * @param {string}   [filters.adjustmentTypeId] - Adjustment type ID.
 * @param {string}   [filters.performedBy] - User ID who performed the action.
 * @param {string}   [filters.sourceType] - Source type (e.g., 'transfer', 'return').
 * @param {string}   [filters.batchType] - 'product' or 'packaging_material'.
 * @param {string}   [filters.fromDate] - Start date (inclusive).
 * @param {string}   [filters.toDate] - End date (inclusive).
 * @returns {{ whereClause: string, params: any[] }} SQL-safe WHERE clause and parameter list.
 */
const buildInventoryLogWhereClause = (filters = {}) => {
  try {
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (filters.warehouseIds?.length) {
      conditions.push(`wi.warehouse_id = ANY($${paramIndex++})`);
      params.push(filters.warehouseIds);
    }
    
    if (filters.locationIds?.length) {
      conditions.push(`li.location_id = ANY($${paramIndex++})`);
      params.push(filters.locationIds);
    }
    
    if (filters.productIds?.length) {
      conditions.push(`p.id = ANY($${paramIndex++})`);
      params.push(filters.productIds);
    }
    
    if (filters.skuIds?.length) {
      conditions.push(`s.id = ANY($${paramIndex++})`);
      params.push(filters.skuIds);
    }
    
    if (filters.batchIds?.length) {
      conditions.push(`br.id = ANY($${paramIndex++})`);
      params.push(filters.batchIds);
    }
    
    if (filters.orderId) {
      conditions.push(`o.id = $${paramIndex++}`);
      params.push(filters.orderId);
    }
    
    if (filters.statusId) {
      conditions.push(`ial.status_id = $${paramIndex++}`);
      params.push(filters.statusId);
    }
    
    if (filters.actionTypeIds?.length) {
      conditions.push(`ial.inventory_action_type_id = ANY($${paramIndex++})`);
      params.push(filters.actionTypeIds);
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
