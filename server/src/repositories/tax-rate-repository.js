const { getUniqueScalarValue, paginateQueryByOffset } = require('../database/db');
const AppError = require('../utils/AppError');
const { buildTaxRateFilter } = require('../utils/sql/build-tax-rate-filters');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Retrieves the tax rate value by its ID.
 *
 * @param {UUID} taxRateId - The ID of the tax rate to fetch.
 * @param {object} [client=null] - Optional database client/transaction.
 * @returns {Promise<number|null>} - The tax rate (e.g., 0.05) or null if not found.
 * @throws {AppError} - If the database query fails.
 */
const getTaxRateById = async (taxRateId, client = null) => {
  try {
    return await getUniqueScalarValue(
      {
        table: 'tax_rates',
        where: { id: taxRateId },
        select: 'rate',
      },
      client,
      {
        context: 'tax-rate-repository/getTaxRateById',
        taxRateId,
      }
    );
  } catch (error) {
    // getUniqueScalarValue already throws with proper context and logs
    throw error;
  }
};

/**
 * Retrieves a paginated list of tax rate records for use in dropdown or autocomplete components.
 *
 * Supports filtering by region, province, validity period, active status, and keyword search.
 * Primarily used in contexts such as order forms, invoice calculations, or product tax setup.
 *
 * @param {Object} options - Lookup options
 * @param {number} [options.limit=50] - Maximum number of results to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {Object} [options.filters={}] - Optional filter fields (e.g., province, region, keyword)
 * @returns {Promise<{ items: { label: string, value: string }[], hasMore: boolean }>} - Paginated dropdown data
 *
 * @throws {AppError} If an error occurs while querying the database
 */
const getTaxRatesLookup = async ({
                                   limit = 50,
                                   offset = 0,
                                   filters = {},
                                 }) => {
  const tableName = 'tax_rates tr';
  const { whereClause, params } = buildTaxRateFilter(filters);
  
  const queryText = `
    SELECT
      tr.id,
      tr.name,
      tr.region,
      tr.rate,
      tr.province,
      tr.is_active,
      tr.valid_from,
      tr.valid_to
    FROM ${tableName}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQueryByOffset({
      tableName,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'tr.name',
      sortOrder: 'ASC',
      additionalSort: 'tr.name ASC',
    });
    
    logSystemInfo('Fetched tax rates lookup successfully', {
      context: 'tax_rates-repository/getTaxRatesLookup',
      totalFetched: result.data?.length ?? 0,
      offset,
      limit,
      filters,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch tax rates lookup', {
      context: 'tax_rates-repository/getTaxRatesLookup',
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch tax rates options.');
  }
};

module.exports = {
  getTaxRateById,
  getTaxRatesLookup,
};
