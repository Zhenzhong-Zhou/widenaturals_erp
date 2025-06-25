/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clause and parameter array
 * for customer dropdowns or paginated list filtering.
 *
 * Supports filtering by status, region, and archived status.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically builds an SQL WHERE clause and parameter list for filtering customers.
 *
 * @param {string} [statusId] - Optional customer status ID. Defaults to active unless overridden.
 * @param {Object} [filters={}] - Optional filters such as region or archived flag.
 * @param {string} [filters.region] - Optional region filter.
 * @param {string} [filters.country] - Optional country filter.
 * @param {string} [filters.createdBy] - Optional creator user ID.
 * @param {string} [filters.keyword] - Matches firstname, lastname, email, or phone (ILIKE).
 * @param {string} [filters.createdAfter] - ISO date string to filter by created_at >=.
 * @param {string} [filters.createdBefore] - ISO date string to filter by created_at <=.
 * @param {string} [filters.statusDateAfter] - Filter by status_date >=.
 * @param {string} [filters.statusDateBefore] - Filter by status_date <=.
 * @param {boolean} [filters.isArchived] - Optional archived flag.
 * @param {Object} [options={}] - Optional options for control flags.
 * @param {boolean} [options.overrideDefaultStatus=false] - Skip filtering by status if true.
 * @param {boolean} [options.includeArchived=false] - Allow archived filter usage.
 *
 * @returns {{ whereClause: string, params: any[] }} - WHERE clause and parameter values.
 *
 * @throws {AppError} - Throws on failure to build condition.
 */
const buildCustomerFilter = (
  statusId,
  filters = {},
  { overrideDefaultStatus = false, includeArchived = false } = {}
) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (!overrideDefaultStatus && statusId) {
      conditions.push(`c.status_id = $${paramIndex}`);
      params.push(statusId);
      paramIndex++;
    }
    
    if (!includeArchived) {
      conditions.push(`c.is_archived = false`);
    } else if (filters.isArchived !== undefined) {
      conditions.push(`c.is_archived = $${paramIndex}`);
      params.push(filters.isArchived);
      paramIndex++;
    }
    
    if (filters.region) {
      conditions.push(`c.region = $${paramIndex}`);
      params.push(filters.region);
      paramIndex++;
    }
    
    if (filters.country) {
      conditions.push(`c.country = $${paramIndex}`);
      params.push(filters.country);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      conditions.push(`c.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.keyword) {
      conditions.push(`(
        c.firstname ILIKE $${paramIndex} OR
        c.lastname ILIKE $${paramIndex} OR
        c.email ILIKE $${paramIndex} OR
        c.phone_number ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.keyword}%`);
      paramIndex++;
    }
    
    if (filters.createdAfter) {
      conditions.push(`c.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }
    
    if (filters.createdBefore) {
      conditions.push(`c.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }
    
    if (filters.statusDateAfter) {
      conditions.push(`c.status_date >= $${paramIndex}`);
      params.push(filters.statusDateAfter);
      paramIndex++;
    }
    
    if (filters.statusDateBefore) {
      conditions.push(`c.status_date <= $${paramIndex}`);
      params.push(filters.statusDateBefore);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build customer filter', {
      context: 'customer-repository/buildCustomerFilter',
      error: err.message,
      filters,
      statusId,
    });
    throw AppError.databaseError(
      'Failed to prepare customer dropdown filter',
      {
        details: err.message,
        stage: 'build-customer-where-clause',
      }
    );
  }
};

module.exports = {
  buildCustomerFilter,
};
