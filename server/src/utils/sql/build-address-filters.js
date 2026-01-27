/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clause and parameter array
 * for address dropdowns or paginated list filtering.
 *
 * Supports filtering by status, region, customer, and dates.
 */

const { normalizeDateRangeFilters, applyDateRangeConditions } = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically builds an SQL WHERE clause and parameter list for filtering addresses.
 *
 * @param {Object} [filters={}] - Optional filters (region, country, customer, etc.).
 * @param {string} [filters.region] - Optional region filter.
 * @param {string} [filters.country] - Optional country filter.
 * @param {string} [filters.customerId] - Optional customer ID filter.
 * @param {string} [filters.createdBy] - Optional creator user ID.
 * @param {string} [filters.updatedBy] - Optional updater user ID.
 * @param {string} [filters.keyword] - Matches label, full_name, email, phone, or city (ILIKE).
 * @param {string} [filters.createdAfter] - Filter by created_at >=.
 * @param {string} [filters.createdBefore] - Filter by created_at <=.
 * @param {string} [filters.updatedAfter] - (Optional) Filter by updated_at >=.
 * @param {string} [filters.updatedBefore] - (Optional) Filter by updated_at <=.
 * @param {boolean} [includeUnassigned=false] - If true, include addresses where customer_id is null in addition to matching customerId.
 *
 * @returns {{ whereClause: string, params: any[] }} - WHERE clause + parameters.
 *
 * @throws {AppError} - Throws on failure to build condition.
 */
const buildAddressFilter = (filters = {}, includeUnassigned = false) => {
  try {
    // Normalize date ranges once
    filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
    filters = normalizeDateRangeFilters(filters, 'updatedAfter', 'updatedBefore');
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    if (filters.customerId) {
      if (includeUnassigned) {
        conditions.push(
          `(a.customer_id = $${paramIndexRef.value} OR a.customer_id IS NULL)`
        );
      } else {
        conditions.push(`a.customer_id = $${paramIndexRef.value}`);
      }
      params.push(filters.customerId);
      paramIndexRef.value++;
    }
    
    if (filters.createdBy) {
      conditions.push(`a.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`a.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    if (filters.region) {
      conditions.push(`a.region = $${paramIndexRef.value}`);
      params.push(filters.region);
      paramIndexRef.value++;
    }
    
    if (filters.country) {
      conditions.push(`a.country = $${paramIndexRef.value}`);
      params.push(filters.country);
      paramIndexRef.value++;
    }
    
    if (filters.keyword) {
      conditions.push(`(
        a.label ILIKE $${paramIndexRef.value} OR
        a.full_name ILIKE $${paramIndexRef.value} OR
        a.email ILIKE $${paramIndexRef.value} OR
        a.phone ILIKE $${paramIndexRef.value} OR
        a.city ILIKE $${paramIndexRef.value}
      )`);
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
    }
    
    // Generic date range handling
    applyDateRangeConditions({
      conditions,
      params,
      column: 'a.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 'a.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build address filter', {
      context: 'address-repository/buildAddressFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare address filter', {
      details: err.message,
      stage: 'build-address-where-clause',
    });
  }
};

module.exports = {
  buildAddressFilter,
};
