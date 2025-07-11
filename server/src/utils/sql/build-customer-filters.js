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
 * Supports various filters such as region, creator, keyword search, date ranges, and
 * address presence via `onlyWithAddress` (has or doesn't have associated addresses).
 *
 * @param {string} [statusId] - Optional customer status ID. Defaults to active unless overridden.
 * @param {Object} [filters={}] - Optional filters to refine the customer query.
 * @param {string} [filters.region] - Optional region filter (not implemented here, placeholder).
 * @param {string} [filters.country] - Optional country filter (not implemented here, placeholder).
 * @param {string} [filters.createdBy] - Optional creator user ID filter.
 * @param {string} [filters.keyword] - Optional keyword to search in firstname, lastname, email, or phone (ILIKE).
 * @param {string} [filters.createdAfter] - ISO date string to filter by `created_at >=`.
 * @param {string} [filters.createdBefore] - ISO date string to filter by `created_at <=`.
 * @param {string} [filters.statusDateAfter] - ISO date string to filter by `status_date >=`.
 * @param {string} [filters.statusDateBefore] - ISO date string to filter by `status_date <=`.
 * @param {boolean} [filters.onlyWithAddress] - If true, only include customers who have at least one address.
 *                                              If false, only include customers without any addresses.
 *                                              If undefined, no filtering by address.
 * @param {Object} [options={}] - Optional options to control query behavior.
 * @param {boolean} [options.overrideDefaultStatus=false] - If true, disables filtering by statusId.
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL-safe WHERE clause string and corresponding parameter array.
 *
 * @throws {AppError} - Throws if filter construction fails due to unexpected error.
 */
const buildCustomerFilter = (
  statusId,
  filters = {},
  { overrideDefaultStatus = false } = {}
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
    
    if (filters.createdBy) {
      conditions.push(`c.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.keyword) {
      conditions.push(`(
        c.firstname ILIKE $${paramIndex} OR
        c.lastname ILIKE $${paramIndex} OR
        c.email ILIKE $${paramIndex + 1} OR
        c.phone_number ILIKE $${paramIndex + 1}
      )`);
      params.push(`${filters.keyword}%`);
      params.push(`%${filters.keyword}%`);
      paramIndex += 2;
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
    
    if (filters.onlyWithAddress === true) {
      conditions.push(`EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id)`);
    } else if (filters.onlyWithAddress === false) {
      conditions.push(`NOT EXISTS (SELECT 1 FROM addresses a WHERE a.customer_id = c.id)`);
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
