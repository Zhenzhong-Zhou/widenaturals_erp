/**
 * @fileoverview
 * Repository-level function for fetching paginated BOMs.
 * Handles SQL query construction, joins, filters, and safe parameterization.
 * Logs query context and metadata for observability and audit tracking.
 */

const { buildBomFilter } = require('../utils/sql/build-bom-filters');
const { paginateQuery } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Repository function to fetch a paginated, filterable, and sortable list of
 * Bill of Materials (BOM) records from the database, including joined
 * product, SKU, compliance, status, and audit user information.
 *
 * This function is responsible solely for query construction and database access.
 * It should not include business logic beyond filtering, sorting, and pagination.
 * Typically consumed by the service layer (e.g., `fetchPaginatedBomsService`).
 *
 * @async
 * @function
 * @param {Object} options - Query and pagination options.
 * @param {Object} [options.filters={}] - Dynamic filters for BOMs (e.g. `keyword`, `skuCode`, `isActive`, `onlyActiveCompliance`).
 * @param {number} [options.page=1] - Page number for pagination.
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy] - Column name or SQL expression to sort by (e.g. `'p.name'`, `'b.created_at'`).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction for results.
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Paginated query result with `data` array and pagination metadata.
 *
 * @example
 * const result = await getPaginatedBoms({
 *   filters: { isActive: true, keyword: 'Marine Oil', onlyActiveCompliance: true },
 *   page: 1,
 *   limit: 25,
 *   sortBy: 'p.name',
 *   sortOrder: 'ASC',
 * });
 *
 * // result.data → array of BOM rows joined with Product, SKU, Compliance, and Status info
 * // result.pagination → { page: 1, limit: 25, totalRecords: 42, totalPages: 5 }
 *
 * @throws {AppError} Throws a `databaseError` when the query or pagination fails.
 *
 * @see buildBomFilter
 * @see paginateQuery
 * @see logSystemInfo
 * @see logSystemException
 */
const getPaginatedBoms = async ({
                                  filters = {},
                                  page = 1,
                                  limit = 10,
                                  sortBy,
                                  sortOrder = 'DESC',
                                }) => {
  const { whereClause, params } = buildBomFilter(filters);
  
  const tableName = 'boms b';
  
  const joins = [
    'JOIN skus AS s ON b.sku_id = s.id',
    'JOIN products AS p ON s.product_id = p.id',
    'LEFT JOIN compliances AS c ON c.sku_id = s.id',
    'LEFT JOIN status AS st_bom ON st_bom.id = b.status_id',
    'LEFT JOIN status AS st_compliance ON st_compliance.id = c.status_id',
    'LEFT JOIN users AS cu ON cu.id = b.created_by',
    'LEFT JOIN users AS uu ON uu.id = b.updated_by',
  ];
  
  const baseQuery = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.brand,
      p.series,
      p.category,
      s.id AS sku_id,
      s.sku AS sku_code,
      s.barcode,
      s.language,
      s.country_code,
      s.market_region,
      s.size_label,
      s.description AS sku_description,
      c.id AS compliance_id,
      c.type AS compliance_type,
      c.compliance_id AS compliance_number,
      st_compliance.name AS compliance_status,
      c.issued_date AS compliance_issued_date,
      c.expiry_date AS compliance_expiry_date,
      b.id AS bom_id,
      b.code AS bom_code,
      b.name AS bom_name,
      b.revision AS bom_revision,
      b.is_active,
      b.is_default,
      b.description AS bom_description,
      b.status_id AS bom_status_id,
      st_bom.name AS bom_status,
      b.status_date AS bom_status_date,
      b.created_at AS bom_created_at,
      b.created_by AS bom_created_by,
      cu.firstname AS bom_created_by_firstname,
      cu.lastname AS bom_created_by_lastname,
      b.updated_at AS bom_updated_at,
      b.updated_by AS bom_updated_by,
      uu.firstname AS bom_updated_by_firstname,
      uu.lastname AS bom_updated_by_lastname
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQuery,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
      meta: {
        module: 'boms',
        context: 'bom-repository/getPaginatedBoms',
        filters
      },
    });
    
    logSystemInfo('Fetched paginated BOM list successfully', {
      context: 'bom-repository/getPaginatedBoms',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
      totalRecords: result.pagination?.totalRecords,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated BOM list', {
      context: 'bom-repository/getPaginatedBoms',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch paginated BOM list', {
      filters,
      pagination: { page, limit },
      error: error.message,
    });
  }
};

module.exports = {
  getPaginatedBoms,
};
