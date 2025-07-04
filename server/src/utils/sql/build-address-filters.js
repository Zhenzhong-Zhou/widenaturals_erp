/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clause and parameter array
 * for address dropdowns or paginated list filtering.
 *
 * Supports filtering by status, region, customer, and dates.
 */

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
 *
 * @returns {{ whereClause: string, params: any[] }} - WHERE clause + parameters.
 *
 * @throws {AppError} - Throws on failure to build condition.
 */
const buildAddressFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (filters.customerId) {
      conditions.push(`a.customer_id = $${paramIndex}`);
      params.push(filters.customerId);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      conditions.push(`a.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`a.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }
    
    if (filters.region) {
      conditions.push(`a.region = $${paramIndex}`);
      params.push(filters.region);
      paramIndex++;
    }
    
    if (filters.country) {
      conditions.push(`a.country = $${paramIndex}`);
      params.push(filters.country);
      paramIndex++;
    }
    
    if (filters.keyword) {
      conditions.push(`(
        a.label ILIKE $${paramIndex} OR
        a.full_name ILIKE $${paramIndex} OR
        a.email ILIKE $${paramIndex} OR
        a.phone ILIKE $${paramIndex} OR
        a.city ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.keyword}%`);
      paramIndex++;
    }
    
    if (filters.createdAfter) {
      conditions.push(`a.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }
    
    if (filters.createdBefore) {
      conditions.push(`a.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }
    
    if (filters.updatedAfter) {
      conditions.push(`a.updated_at >= $${paramIndex}`);
      params.push(filters.updatedAfter);
      paramIndex++;
    }
    
    if (filters.updatedBefore) {
      conditions.push(`a.updated_at <= $${paramIndex}`);
      params.push(filters.updatedBefore);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build address filter', {
      context: 'address-repository/buildAddressFilter',
      error: err.message,
      filters,
      statusId,
    });
    throw AppError.databaseError(
      'Failed to prepare address filter',
      {
        details: err.message,
        stage: 'build-address-where-clause',
      }
    );
  }
};

module.exports = {
  buildAddressFilter,
};
