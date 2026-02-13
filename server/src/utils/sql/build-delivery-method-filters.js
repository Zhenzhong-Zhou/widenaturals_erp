/**
 * @fileoverview
 * Utility to build a dynamic SQL WHERE clause and parameter array
 * for filtering delivery method records in the database.
 */

const { normalizeDateRangeFilters, applyDateRangeConditions } = require('./date-range-utils');
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
    // -------------------------------------------------------------
    // Normalize date range filters FIRST
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    if (filters.methodName) {
      conditions.push(`dm.method_name = $${paramIndexRef.value}`);
      params.push(filters.methodName);
      paramIndexRef.value++;
    }
    
    if (filters.isPickupLocation !== undefined) {
      conditions.push(`dm.is_pickup_location = $${paramIndexRef.value}`);
      params.push(filters.isPickupLocation);
      paramIndexRef.value++;
    }
    
    if (filters.createdBy) {
      conditions.push(`dm.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`dm.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    if (filters.keyword) {
      const keywordParam = `%${filters.keyword}%`;
      conditions.push(
        `(dm.method_name ILIKE $${paramIndexRef.value} OR dm.description ILIKE $${paramIndexRef.value})`
      );
      params.push(keywordParam);
      paramIndexRef.value++;
    }
    
    // Enforce status filter by user access (always applied regardless of keyword)
    if (filters.statusId) {
      conditions.push(`dm.status_id = $${paramIndexRef.value}`);
      params.push(filters.statusId);
      paramIndexRef.value++;
    } else if (filters._activeStatusId) {
      conditions.push(`dm.status_id = $${paramIndexRef.value}`);
      params.push(filters._activeStatusId);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Created date filters (via helper)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'dm.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
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
