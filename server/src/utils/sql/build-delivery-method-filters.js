/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering delivery method records in the database.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds an SQL WHERE clause and parameter list for filtering delivery method records.
 *
 * Supports filtering by:
 * - Exact match on method name
 * - Pickup location flag
 * - Status ID
 * - Created or updated by user
 * - Created date range
 * - Keyword match against method name or description, optionally restricted to active status
 *
 * @param {Object} [filters={}] - Filtering options.
 * @param {string} [filters.methodName] - Filter by exact method name.
 * @param {boolean} [filters.isPickupLocation] - Filter by whether the method is a pickup location.
 * @param {string} [filters.statusId] - Filter by status UUID.
 * @param {string} [filters.createdBy] - Filter by creator user ID.
 * @param {string} [filters.updatedBy] - Filter by updater user ID.
 * @param {string} [filters.keyword] - Keyword search for method name or description (case-insensitive).
 * @param {string} [filters.createdAfter] - Filter by creation date (inclusive, >= ISO string).
 * @param {string} [filters.createdBefore] - Filter by creation date (inclusive, <= ISO string).
 *
 * @param {boolean} [filters._restrictKeywordToActiveOnly] - (Internal) If true, limits keyword matches to a specific status.
 * @param {string} [filters._activeStatusId] - (Internal) Status ID to use when `_restrictKeywordToActiveOnly` is enabled.
 *
 * @returns {{ whereClause: string, params: any[] }} Object containing the SQL WHERE clause and parameter values.
 *
 * @throws {AppError} Throws if the filter construction fails.
 */
const buildDeliveryMethodFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (filters.methodName) {
      conditions.push(`dm.method_name = $${paramIndex}`);
      params.push(filters.methodName);
      paramIndex++;
    }
    
    if (filters.isPickupLocation !== undefined) {
      conditions.push(`dm.is_pickup_location = $${paramIndex}`);
      params.push(filters.isPickupLocation);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      conditions.push(`dm.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`dm.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }
    
    if (filters.keyword) {
      const keywordParam = `%${filters.keyword}%`;
      conditions.push(`(dm.method_name ILIKE $${paramIndex} OR dm.description ILIKE $${paramIndex})`);
      params.push(keywordParam);
      paramIndex++;
    }

    // Enforce status filter by user access (always applied regardless of keyword)
    if (filters.statusId) {
      conditions.push(`dm.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    } else if (filters._activeStatusId) {
      conditions.push(`dm.status_id = $${paramIndex}`);
      params.push(filters._activeStatusId);
      paramIndex++;
    }
    
    if (filters.createdAfter) {
      conditions.push(`dm.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }
    
    if (filters.createdBefore) {
      conditions.push(`dm.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build delivery method filter', {
      context: 'delivery-method-repository/buildDeliveryMethodFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare delivery method filter', {
      details: err.message,
      stage: 'build-delivery-method-where-clause',
    });
  }
};

module.exports = {
  buildDeliveryMethodFilter,
};
