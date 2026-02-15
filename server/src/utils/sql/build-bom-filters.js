/**
 * @fileoverview
 * Utility to dynamically build a SQL `WHERE` clause and parameter array
 * for querying the `boms` table (aliased as `b`) and its related SKU/Product data.
 *
 * Supports filtering by:
 * - SKU ID(s)
 * - Product name (partial match)
 * - SKU code (partial match)
 * - Status ID
 * - Is active flag
 * - Revision range
 * - Created/updated user
 * - Created or updated date ranges
 * - Keyword search (BOM name/code/description)
 *
 * Output is designed for safe use with parameterized queries (e.g., `pg.query`).
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Utility to dynamically construct a parameterized SQL `WHERE` clause and parameters
 * for querying BOM (Bill of Materials) records joined with SKU, Product, and Compliance data.
 *
 * Supports advanced filtering by BOM status, SKU, Product, Compliance attributes,
 * revision range, audit users, and keyword search. Used primarily by
 * `getPaginatedBoms()` in the repository layer.
 *
 * All clauses are safely parameterized for PostgreSQL to prevent SQL injection.
 *
 * @function
 * @param {Object} [filters={}] - Dynamic filtering options.
 *
 * @param {string|string[]} [filters.skuId] - One or more SKU UUIDs to filter by.
 * @param {string|string[]} [filters.productId] - One or more Product UUIDs to filter by.
 * @param {string} [filters.productName] - Partial match on product name (`ILIKE`).
 * @param {string} [filters.skuCode] - Partial match on SKU code (`ILIKE`).
 *
 * @param {string} [filters.statusId] - Filter by BOM status UUID.
 * @param {boolean} [filters.isActive] - Whether BOM is active (`b.is_active`).
 * @param {boolean} [filters.isDefault] - Whether BOM is marked as default (`b.is_default`).
 *
 * @param {number} [filters.revisionMin] - Minimum BOM revision number.
 * @param {number} [filters.revisionMax] - Maximum BOM revision number.
 *
 * @param {string} [filters.createdBy] - Filter by creator user UUID.
 * @param {string} [filters.updatedBy] - Filter by updater user UUID.
 * @param {string} [filters.createdAfter] - Filter BOMs created after this ISO date.
 * @param {string} [filters.createdBefore] - Filter BOMs created before this ISO date.
 *
 * @param {string} [filters.keyword] - Case-insensitive keyword match across BOM `name`, `code`, or `description`.
 *
 * @param {string} [filters.complianceType] - Filter by Compliance type (e.g., `"NPN"`, `"FDA"`, `"EU_CERT"`).
 * @param {string} [filters.complianceStatusId] - Filter by Compliance status UUID.
 * @param {boolean} [filters.onlyActiveCompliance] - If `true`, restricts results to SKUs with active compliance.
 * @param {string} [filters.complianceIssuedAfter] - Include Compliance records issued after this date.
 * @param {string} [filters.complianceExpiredBefore] - Include Compliance records expiring before this date.
 *
 * @returns {{ whereClause: string, params: any[] }}
 * Parameterized SQL clause and parameter list for use in repository queries.
 *
 * @example
 * const { whereClause, params } = buildBomFilter({
 *   skuId: '374cfaad-a0ca-44dc-bfdd-19478c21f899',
 *   isActive: true,
 *   complianceType: 'NPN',
 *   onlyActiveCompliance: true,
 *   keyword: 'Omega',
 * });
 *
 * // Output:
 * // whereClause →
 * //   "1=1 AND b.sku_id = $1 AND b.is_active = $2
 * //    AND c.type ILIKE $3 AND st_compliance.name ILIKE 'active'
 * //    AND (b.name ILIKE $4 OR b.code ILIKE $4 OR b.description ILIKE $4)"
 * // params → ['374cfaad-a0ca-44dc-bfdd-19478c21f899', true, '%NPN%', '%Omega%']
 *
 * @throws {AppError}
 * Throws `AppError.databaseError` if the clause construction fails unexpectedly.
 *
 * @see getPaginatedBoms
 * @see logSystemException
 */
const buildBomFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date range filters FIRST
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(
      filters,
      'complianceIssuedAfter',
      'complianceExpiredBefore'
    );
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    // ------------------------------
    // SKU ID(s)
    // ------------------------------
    if (filters.skuId) {
      if (Array.isArray(filters.skuId)) {
        const placeholders = filters.skuId
          .map(() => `$${paramIndexRef.value++}`)
          .join(', ');
        conditions.push(`b.sku_id IN (${placeholders})`);
        params.push(...filters.skuId);
      } else {
        conditions.push(`b.sku_id = $${paramIndexRef.value}`);
        params.push(filters.skuId);
        paramIndexRef.value++;
      }
    }

    // ------------------------------
    // Product ID(s)
    // ------------------------------
    if (filters.productId) {
      if (Array.isArray(filters.productId)) {
        const placeholders = filters.productId
          .map(() => `$${paramIndexRef.value++}`)
          .join(', ');
        conditions.push(`p.id IN (${placeholders})`);
        params.push(...filters.productId);
      } else {
        conditions.push(`p.id = $${paramIndexRef.value}`);
        params.push(filters.productId);
        paramIndexRef.value++;
      }
    }

    // Product name (partial)
    if (filters.productName) {
      conditions.push(`p.name ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.productName}%`);
      paramIndexRef.value++;
    }

    // SKU code (partial)
    if (filters.skuCode) {
      conditions.push(`s.sku ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.skuCode}%`);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Compliance filters
    // ------------------------------
    if (filters.complianceType) {
      conditions.push(`cr.type ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.complianceType}%`);
      paramIndexRef.value++;
    }

    if (filters.complianceStatusId) {
      conditions.push(`cr.status_id = $${paramIndexRef.value}`);
      params.push(filters.complianceStatusId);
      paramIndexRef.value++;
    }

    if (filters.onlyActiveCompliance === true) {
      conditions.push(`LOWER(st_compliance.name) = 'active'`);
    }

    // ------------------------------
    // Compliance date filters (via helper)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'cr.issued_date',
      after: filters.complianceIssuedAfter,
      before: undefined,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 'cr.expiry_date',
      after: undefined,
      before: filters.complianceExpiredBefore,
      paramIndexRef,
    });

    // ------------------------------
    // BOM status filters
    // ------------------------------
    if (filters.statusId) {
      conditions.push(`b.status_id = $${paramIndexRef.value}`);
      params.push(filters.statusId);
      paramIndexRef.value++;
    }

    // Is Active / Default
    if (typeof filters.isActive === 'boolean') {
      conditions.push(`b.is_active = $${paramIndexRef.value}`);
      params.push(filters.isActive);
      paramIndexRef.value++;
    }

    if (typeof filters.isDefault === 'boolean') {
      conditions.push(`b.is_default = $${paramIndexRef.value}`);
      params.push(filters.isDefault);
      paramIndexRef.value++;
    }

    // Revision range
    if (filters.revisionMin) {
      conditions.push(`b.revision >= $${paramIndexRef.value}`);
      params.push(filters.revisionMin);
      paramIndexRef.value++;
    }

    if (filters.revisionMax) {
      conditions.push(`b.revision <= $${paramIndexRef.value}`);
      params.push(filters.revisionMax);
      paramIndexRef.value++;
    }

    // Created / Updated by
    if (filters.createdBy) {
      conditions.push(`b.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`b.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Record creation date filters (via helper)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'b.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    // ------------------------------
    // Keyword
    // ------------------------------
    if (filters.keyword) {
      const kw = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;
      conditions.push(
        `(b.name ILIKE $${paramIndexRef.value} OR
          b.code ILIKE $${paramIndexRef.value} OR
          b.description ILIKE $${paramIndexRef.value})`
      );
      params.push(kw);
      paramIndexRef.value++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build BOM filter', {
      context: 'bom-repository/buildBomFilter',
      filters,
    });
    throw AppError.databaseError('Failed to build BOM filter', {
      details: err.message,
      stage: 'build-bom-where-clause',
      filters,
    });
  }
};

module.exports = {
  buildBomFilter,
};
