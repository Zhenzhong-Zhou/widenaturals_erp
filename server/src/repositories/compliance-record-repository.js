/**
 * @file compliance-record-repository.js
 * @description Database access layer for compliance record data.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from compliance-record-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getPaginatedComplianceRecords — paginated list with filtering and sorting
 *  - getComplianceBySkuId         — fetch all compliance records for a SKU
 */

'use strict';

const { paginateQuery } = require('../utils/db/pagination/pagination-helpers');
const { query } = require('../database/db');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError } = require('../utils/db-logger');
const { buildComplianceRecordFilter } = require('../utils/sql/build-compliance-record-filter');
const { resolveSort } = require('../utils/query/sort-resolver');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const {
  COMPLIANCE_RECORD_TABLE,
  COMPLIANCE_RECORD_JOINS,
  COMPLIANCE_RECORD_SORT_WHITELIST,
  buildComplianceRecordQuery,
  COMPLIANCE_BY_SKU_QUERY,
} = require('./queries/compliance-record-queries');

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated compliance records with optional filtering and sorting.
 *
 * Joins SKU, product, status, and audit user fields.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]           - Field filters.
 * @param {number}       [options.page=1]               - Page number (1-based).
 * @param {number}       [options.limit=10]             - Records per page.
 * @param {string}       [options.sortBy='createdAt']   - Sort key (mapped via complianceRecordSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getPaginatedComplianceRecords = async ({
                                               filters   = {},
                                               page      = 1,
                                               limit     = 10,
                                               sortBy    = 'createdAt',  // map key, not DB column
                                               sortOrder = 'DESC',
                                             }) => {
  const context = 'compliance-record-repository/getPaginatedComplianceRecords';
  
  const { whereClause, params } = buildComplianceRecordFilter(filters);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'complianceRecordSortMap',
    defaultSort: SORTABLE_FIELDS.complianceRecordSortMap.defaultNaturalSort,
  });
  
  // ORDER BY omitted — paginateQuery appends it from sortConfig.
  const queryText = buildComplianceRecordQuery(whereClause);
  
  try {
    return await paginateQuery({
      tableName:    COMPLIANCE_RECORD_TABLE,
      joins:        COMPLIANCE_RECORD_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: COMPLIANCE_RECORD_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated compliance records.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, page, limit }
      ),
    });
  }
};

// ─── By SKU ───────────────────────────────────────────────────────────────────

/**
 * Fetches all compliance records linked to a SKU.
 *
 * Returns records ordered by issued_date then expiry_date, most recent first.
 * Returns an empty array if no compliance records are linked to the SKU.
 *
 * @param {string} skuId - UUID of the SKU.
 *
 * @returns {Promise<Array<Object>>} Compliance record rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getComplianceBySkuId = async (skuId) => {
  const context = 'compliance-record-repository/getComplianceBySkuId';
  
  try {
    const { rows } = await query(COMPLIANCE_BY_SKU_QUERY, [skuId]);
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU compliance records.',
      meta:    { skuId },
      logFn:   (err) => logDbQueryError(
        COMPLIANCE_BY_SKU_QUERY,
        [skuId],
        err,
        { context, skuId }
      ),
    });
  }
};

module.exports = {
  getPaginatedComplianceRecords,
  getComplianceBySkuId,
};
