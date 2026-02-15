const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build WHERE clause + SQL params for compliance list queries.
 *
 * NEW SCHEMA (normalized):
 * - compliance_records      => cr
 * - sku_compliance_links    => scl
 * - skus                    => s
 * - products                => p
 *
 * ### Supported Filters:
 * - Compliance-level (cr.*)
 *   - type
 *   - statusIds[]
 *   - complianceId (ILIKE)
 *   - issuedAfter / issuedBefore
 *   - expiringBefore / expiringAfter
 *   - createdBy / updatedBy
 *   - createdAfter / createdBefore
 *   - updatedAfter / updatedBefore
 *
 * - SKU-level (s.*)
 *   - sku
 *   - sizeLabel
 *   - marketRegion
 *
 * - Product-level (p.*)
 *   - productName (ILIKE)
 *   - brand
 *   - category
 *
 * - Keyword fuzzy search
 *   Matches: compliance_id, sku, product name, brand, category
 *
 * @param {Object} [filters={}] - Filter criteria.
 * @param {string} [filters.type] - Compliance document type (e.g., "NPN").
 * @param {string[]} [filters.statusIds] - Allowed compliance status UUIDs.
 * @param {string} [filters.complianceId] - Partial match against compliance ID.
 * @param {string} [filters.issuedAfter] - Lower bound for issued_date (ISO datetime).
 * @param {string} [filters.issuedBefore] - Upper bound for issued_date.
 * @param {string} [filters.expiringAfter] - Lower bound for expiry_date.
 * @param {string} [filters.expiringBefore] - Upper bound for expiry_date.
 * @param {string} [filters.createdBy] - Creator UUID.
 * @param {string} [filters.updatedBy] - Updater UUID.
 * @param {string} [filters.createdAfter] - Lower bound for created_at.
 * @param {string} [filters.createdBefore] - Upper bound for created_at.
 * @param {string} [filters.updatedAfter] - Lower bound for updated_at.
 * @param {string} [filters.updatedBefore] - Upper bound for updated_at.
 * @param {string[]} [filters.skuIds] - Array of SKU IDs (UUIDs) to filter records by. Matches exact SKU IDs using `s.id = ANY(...)`.
 * @param {string} [filters.sku] - Partial ILIKE match for SKU code.
 * @param {string} [filters.sizeLabel] - Partial ILIKE match for SKU size label.
 * @param {string} [filters.marketRegion] - Partial ILIKE match for region.
 * @param {string} [filters.productName] - Partial ILIKE match for product name.
 * @param {string} [filters.brand] - Partial ILIKE match for product brand.
 * @param {string} [filters.category] - Partial ILIKE match for product category.
 * @param {string} [filters.keyword] - Fuzzy search across compliance, sku, product.
 * @returns {{ whereClause: string, params: any[] }}
 *          SQL-ready WHERE clause + parameter array for prepared statements.
 */
const buildComplianceRecordFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date range filters FIRST
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'issuedAfter', 'issuedBefore');
    filters = normalizeDateRangeFilters(
      filters,
      'expiringAfter',
      'expiringBefore'
    );
    filters = normalizeDateRangeFilters(
      filters,
      'createdAfter',
      'createdBefore'
    );
    filters = normalizeDateRangeFilters(
      filters,
      'updatedAfter',
      'updatedBefore'
    );

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    // ----------------------------------------
    // Compliance-level filters (cr.*)
    // ----------------------------------------
    if (filters.type) {
      conditions.push(`cr.type = $${paramIndexRef.value}`);
      params.push(filters.type);
      paramIndexRef.value++;
    }

    if (filters.statusIds?.length) {
      conditions.push(`cr.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }

    if (filters.complianceId) {
      conditions.push(`cr.compliance_id ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.complianceId}%`);
      paramIndexRef.value++;
    }

    // ----------------------------------------
    // Compliance issued / expiry date filters
    // ----------------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'cr.issued_date',
      after: filters.issuedAfter,
      before: filters.issuedBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 'cr.expiry_date',
      after: filters.expiringAfter,
      before: filters.expiringBefore,
      paramIndexRef,
    });

    // ----------------------------------------
    // Audit: who created / updated
    // ----------------------------------------
    if (filters.createdBy) {
      conditions.push(`cr.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }

    if (filters.updatedBy) {
      conditions.push(`cr.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }

    // ----------------------------------------
    // Record created / updated date filters
    // ----------------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'cr.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });

    applyDateRangeConditions({
      conditions,
      params,
      column: 'cr.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });

    // ----------------------------------------
    // SKU-level filters (s.*)
    // ----------------------------------------
    if (filters.skuIds?.length > 0) {
      conditions.push(`s.id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.skuIds);
      paramIndexRef.value++;
    }

    if (filters.sku) {
      conditions.push(`s.sku ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.sku}%`);
      paramIndexRef.value++;
    }

    if (filters.sizeLabel) {
      conditions.push(`s.size_label ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.sizeLabel}%`);
      paramIndexRef.value++;
    }

    if (filters.marketRegion) {
      conditions.push(`s.market_region ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.marketRegion}%`);
      paramIndexRef.value++;
    }

    // ----------------------------------------
    // Product-level filters (p.*)
    // ----------------------------------------
    if (filters.productName) {
      conditions.push(`p.name ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.productName}%`);
      paramIndexRef.value++;
    }

    if (filters.brand) {
      conditions.push(`p.brand ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.brand}%`);
      paramIndexRef.value++;
    }

    if (filters.category) {
      conditions.push(`p.category ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.category}%`);
      paramIndexRef.value++;
    }

    // ----------------------------------------
    // Keyword search (multi-field fuzzy)
    // ----------------------------------------
    if (filters.keyword) {
      conditions.push(`(
        cr.compliance_id ILIKE $${paramIndexRef.value} OR
        s.sku ILIKE $${paramIndexRef.value} OR
        p.name ILIKE $${paramIndexRef.value} OR
        p.brand ILIKE $${paramIndexRef.value} OR
        p.category ILIKE $${paramIndexRef.value}
      )`);
      params.push(`%${filters.keyword}%`);
      paramIndexRef.value++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build compliance filter', {
      context: 'compliance-record-repository/buildComplianceRecordFilter',
      filters,
    });

    throw AppError.databaseError('Failed to prepare compliance filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildComplianceRecordFilter,
};
