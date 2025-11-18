const { query, paginateResults } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { getSortMapForModule } = require('../utils/sort-utils');
const { buildComplianceRecordFilter } = require('../utils/sql/build-compliance-record-filters');

/**
 * Repository: Get Paginated Compliance Records
 *
 * Retrieves compliance documents (NPN/FDA/COA/etc.) with pagination,
 * SQL-safe sorting, and joins to products and SKUs.
 *
 * NEW SCHEMA (normalized):
 * - compliance_records cr
 * - sku_compliance_links scl    (M:N links)
 * - skus s
 * - products p
 * - status st
 * - users u1/u2 for audit
 *
 * @param {Object} options
 * @param {Object} [options.filters={}]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @param {string} [options.sortBy='cr.created_at']
 * @param {string} [options.sortOrder='DESC']
 */
const getPaginatedComplianceRecords = async ({
                                         filters = {},
                                         page = 1,
                                         limit = 10,
                                         sortBy = 'cr.created_at',
                                         sortOrder = 'DESC',
                                       }) => {
  const context = 'compliance-record-repository/getPaginatedComplianceRecords';
  
  // ------------------------------------
  // 1. Load sort map for compliance module
  // ------------------------------------
  const sortMap = getSortMapForModule('complianceSortMap');
  
  const allowedSort = new Set(Object.values(sortMap));
  
  let sortByColumn = sortBy;
  if (!allowedSort.has(sortByColumn)) {
    sortByColumn = sortMap.defaultNaturalSort;
  }
  
  try {
    // ------------------------------------
    // 2. Build WHERE clause
    //    (extendable: type, statusId, complianceId, date ranges)
    // ------------------------------------
    const { whereClause, params } = buildComplianceRecordFilter(filters);
    
    // ------------------------------------
    // 3. Build SELECT
    // ------------------------------------
    const dataQuery = `
      SELECT
        cr.id AS compliance_id,
        cr.type,
        cr.compliance_id AS document_number,
        cr.issued_date,
        cr.expiry_date,
        cr.description,
        cr.status_id,
        st.name AS status_name,
        cr.status_date,
        cr.created_at,
        cr.updated_at,
        cr.created_by,
        u1.firstname AS created_by_firstname,
        u1.lastname AS created_by_lastname,
        cr.updated_by,
        u2.firstname AS updated_by_firstname,
        u2.lastname AS updated_by_lastname,
        s.id AS sku_id,
        s.sku AS sku_code,
        s.size_label,
        s.market_region,
        p.id AS product_id,
        p.name AS product_name,
        p.brand,
        p.series,
        p.category
      FROM compliance_records cr
      JOIN sku_compliance_links scl ON scl.compliance_record_id = cr.id
      JOIN skus s ON s.id = scl.sku_id
      JOIN products p ON p.id = s.product_id
      JOIN status st ON st.id = cr.status_id
      LEFT JOIN users u1 ON cr.created_by = u1.id
      LEFT JOIN users u2 ON cr.updated_by = u2.id
      WHERE ${whereClause}
      ORDER BY ${sortByColumn} ${sortOrder}
    `;
    
    // ------------------------------------
    // 4. Execute with pagination helper
    // ------------------------------------
    const result = await paginateResults({
      dataQuery,
      params,
      page,
      limit,
      meta: { context },
    });
    
    // ------------------------------------
    // 5. Logging
    // ------------------------------------
    logSystemInfo('Fetched paginated compliance records', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy: sortByColumn, sortOrder },
      count: result.data.length,
    });
    
    return result;
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch paginated compliance records',
      {
        context,
        filters,
        pagination: { page, limit },
      }
    );
    
    throw AppError.databaseError(
      'Failed to fetch compliance records.',
      { context }
    );
  }
};

const getComplianceBySkuId = async (skuId) => {
  const context = 'compliance-record-repository/getComplianceBySkuId';
  
  const queryText = `
    SELECT
      cr.id,
      cr.type,
      cr.compliance_id,
      cr.issued_date,
      cr.expiry_date,
      cr.description,
      cr.status_id,
      st.name AS status_name,
      cr.status_date,
      cr.created_at,
      cr.updated_at,
      cr.created_by,
      cr.updated_by,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
    FROM sku_compliance_links AS scl
    JOIN compliance_records AS cr
      ON cr.id = scl.compliance_record_id
    LEFT JOIN status AS st
      ON st.id = cr.status_id
    LEFT JOIN users AS u1
      ON cr.created_by = u1.id
    LEFT JOIN users AS u2
      ON cr.updated_by = u2.id
    WHERE scl.sku_id = $1
    ORDER BY cr.issued_date DESC NULLS LAST,
             cr.expiry_date DESC NULLS LAST
  `;
  
  try {
    const { rows } = await query(queryText, [skuId]);
    
    if (rows.length === 0) {
      logSystemInfo('No compliance records linked to SKU', {
        context,
        skuId,
      });
      return [];
    }
    
    logSystemInfo('Fetched SKU compliance records successfully', {
      context,
      skuId,
      count: rows.length,
    });
    
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU compliance records', {
      context,
      skuId,
      error: error.message,
    });
    
    throw AppError.databaseError('Failed to fetch SKU compliance records.', {
      context,
      details: error.message,
    });
  }
};

module.exports = {
  getPaginatedComplianceRecords,
  getComplianceBySkuId,
};
