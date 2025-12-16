/**
 * Compliance Record Repository
 *
 * Provides:
 * - Paginated listing of compliance documents with join on SKU + Product
 * - Per-SKU compliance detail retrieval
 *
 * NEW NORMALIZED SCHEMA:
 * - compliance_records (cr)
 * - sku_compliance_links (scl)
 * - skus (s)
 * - products (p)
 * - status (st)
 * - users (u1/u2)
 */

const { query, paginateResults } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { getSortMapForModule } = require('../utils/sort-utils');
const {
  buildComplianceRecordFilter,
} = require('../utils/sql/build-compliance-record-filters');

/**
 * Repository: Get Paginated Compliance Records
 *
 * Retrieves compliance documents (NPN / FDA / COA / etc.) using the normalized schema:
 *
 *   compliance_records (cr)
 *        └─< sku_compliance_links (scl)
 *              └─ skus (s)
 *                    └─ products (p)
 *        └─ status (st)
 *        └─ users (u1/u2) for audit metadata
 *
 * The query returns one row per (compliance_record ↔ SKU) link, allowing multiple SKUs
 * to share the same compliance document.
 *
 * ------------------------------------------------------------
 * Supported Filters (via `buildComplianceRecordFilter(filters)`)
 * ------------------------------------------------------------
 * - `type`                → Exact match (e.g., "NPN", "FDA")
 * - `statusId`            → Filter by compliance record status
 * - `complianceId`        → Partial ILIKE match on document number
 * - `issuedAfter`         → issued_date >= X
 * - `expiringBefore`      → expiry_date <= X
 * - You may optionally extend filters to SKU/product fields (via join)
 *
 * ---------------------------------------------
 * Sorting (SQL-safe, enforced via sortMap)
 * ---------------------------------------------
 * - `sortBy` must come from `complianceSortMap`.
 * - If invalid or unsafe → falls back to `defaultNaturalSort` defined in sortMap.
 * - Ensures protection against SQL injection in ORDER BY.
 *
 * ---------------------------------------------
 * Pagination
 * ---------------------------------------------
 * Uses shared helper `paginateResults`:
 * {
 *   data: [...rows],
 *   meta: { page, limit, total, totalPages }
 * }
 *
 * @async
 * @function
 *
 * @param {Object} options
 * @param {Object} [options.filters={}]   - Filter criteria applied by WHERE builder
 * @param {number} [options.page=1]       - 1-based page index
 * @param {number} [options.limit=10]     - Rows per page
 * @param {string} [options.sortBy='cr.created_at']
 *        SQL-safe column alias (validated against complianceSortMap)
 * @param {string} [options.sortOrder='DESC']
 *        Sort direction ("ASC" | "DESC")
 *
 * @returns {Promise<{ data: Array<Object>, meta: Object }>}
 *   data: Array of compliance rows enriched with:
 *     {
 *       compliance_id, type, document_number, issued_date, expiry_date, description,
 *       status_id, status_name, status_date,
 *       created_at, updated_at,
 *       created_by, created_by_firstname, created_by_lastname,
 *       updated_by, updated_by_firstname, updated_by_lastname,
 *       sku_id, sku_code, size_label, market_region,
 *       product_id, product_name, brand, series, category
 *     }
 *
 *   meta: {
 *     page, limit, total, totalPages
 *   }
 *
 * @throws {AppError} Database error on query/pagination failure.
 *
 * ---------------------------------------------
 * Performance Notes
 * ---------------------------------------------
 * - All join columns use indexed UUID FKs.
 * - Filtering and sorting operate on indexed columns (status_id, type, created_at).
 * - Pagination uses LIMIT/OFFSET (PostgreSQL-optimized for these row sizes).
 */
const getPaginatedComplianceRecords = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'cr.created_at',
  sortOrder = 'DESC',
}) => {
  const context = 'compliance-record-repository/getPaginatedComplianceRecords';

  // -------------------------------
  // 1. Sort Map
  // -------------------------------
  const sortMap = getSortMapForModule('complianceRecordSortMap');
  const allowedSort = new Set(Object.values(sortMap));

  let sortByColumn = allowedSort.has(sortBy)
    ? sortBy
    : sortMap.defaultNaturalSort;

  try {
    // -------------------------------
    // 2. WHERE clause + params
    // -------------------------------
    const { whereClause, params } = buildComplianceRecordFilter(filters);

    // -------------------------------
    // 3. SELECT QUERY (paginated)
    // -------------------------------
    const dataQuery = `
      SELECT
        cr.id AS compliance_record_id,
        cr.type,
        cr.compliance_id AS document_number,
        cr.issued_date,
        cr.expiry_date,
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
        s.country_code,
        p.id AS product_id,
        p.name AS product_name,
        p.brand,
        p.series,
        p.category
      FROM compliance_records cr
      JOIN sku_compliance_links scl
        ON scl.compliance_record_id = cr.id
      JOIN skus s
        ON s.id = scl.sku_id
      JOIN products p
        ON p.id = s.product_id
      JOIN status st
        ON st.id = cr.status_id
      LEFT JOIN users u1
        ON u1.id = cr.created_by
      LEFT JOIN users u2
        ON u2.id = cr.updated_by
      WHERE ${whereClause}
      ORDER BY ${sortByColumn} ${sortOrder}
    `;

    // -------------------------------
    // 4. Pagination Helper
    // -------------------------------
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
    logSystemException(error, 'Failed to fetch paginated compliance records', {
      context,
      filters,
      pagination: { page, limit },
    });

    throw AppError.databaseError('Failed to fetch compliance records.', {
      context,
      details: error.message,
    });
  }
};

/**
 * Fetch all compliance records linked to a specific SKU.
 *
 * This function performs a normalized join through:
 *   sku_compliance_links (M:N mapping)
 *        → compliance_records (main document table)
 *        → status (status metadata)
 *        → users (audit metadata)
 *
 * Returned fields include:
 *   - Compliance document metadata (type, compliance_id, issue/expiry dates)
 *   - Compliance status (status_id + status_name)
 *   - Audit metadata (created_by, updated_by + names)
 *
 * Ordering:
 *   - Most recently issued compliance records first
 *   - If issued_date is NULL, NULLS LAST ensures stable sort
 *
 * Performance:
 *   - Uses indexed FK lookups on scl.sku_id
 *   - Only returns relevant documents for one SKU (small set)
 *
 * @async
 * @function
 *
 * @param {string} skuId
 *   UUID of the SKU whose compliance records should be retrieved.
 *
 * @returns {Promise<Array<Object>>}
 *   Array of compliance record rows, each containing:
 *     {
 *       id, type, compliance_id, issued_date, expiry_date, description,
 *       status_id, status_name, status_date,
 *       created_at, updated_at,
 *       created_by, created_by_firstname, created_by_lastname,
 *       updated_by, updated_by_firstname, updated_by_lastname
 *     }
 *
 * @throws {AppError} Database error on query failure.
 */
const getComplianceBySkuId = async (skuId) => {
  const context = 'compliance-record-repository/getComplianceBySkuId';

  // -----------------------------------------------
  // SQL query: fetch compliance documents for a SKU
  // -----------------------------------------------
  const sql = `
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
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      cr.updated_by,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
    FROM sku_compliance_links scl
    JOIN compliance_records cr
      ON cr.id = scl.compliance_record_id
    LEFT JOIN status st
      ON st.id = cr.status_id
    LEFT JOIN users u1
      ON u1.id = cr.created_by
    LEFT JOIN users u2
      ON u2.id = cr.updated_by
    WHERE scl.sku_id = $1
    ORDER BY
      cr.issued_date DESC NULLS LAST,
      cr.expiry_date DESC NULLS LAST
  `;

  try {
    const { rows } = await query(sql, [skuId]);

    // Logging for observability / debugging
    logSystemInfo('Fetched SKU compliance records', {
      context,
      skuId,
      count: rows.length,
    });

    return rows;
  } catch (error) {
    // Structured logging for Sentry/CloudWatch integration
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
