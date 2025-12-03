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
    const conditions = ['1=1'];
    const params = [];
    let i = 1;

    // ----------------------------------------
    // Compliance-level filters (cr.*)
    // ----------------------------------------
    if (filters.type) {
      conditions.push(`cr.type = $${i}`);
      params.push(filters.type);
      i++;
    }

    if (filters.statusIds?.length) {
      conditions.push(`cr.status_id = ANY($${i}::uuid[])`);
      params.push(filters.statusIds);
      i++;
    }

    if (filters.complianceId) {
      conditions.push(`cr.compliance_id ILIKE $${i}`);
      params.push(`%${filters.complianceId}%`);
      i++;
    }

    if (filters.issuedAfter) {
      conditions.push(`cr.issued_date >= $${i}`);
      params.push(filters.issuedAfter);
      i++;
    }

    if (filters.issuedBefore) {
      conditions.push(`cr.issued_date <= $${i}`);
      params.push(filters.issuedBefore);
      i++;
    }

    if (filters.expiringAfter) {
      conditions.push(`cr.expiry_date >= $${i}`);
      params.push(filters.expiringAfter);
      i++;
    }

    if (filters.expiringBefore) {
      conditions.push(`cr.expiry_date <= $${i}`);
      params.push(filters.expiringBefore);
      i++;
    }

    // Audit: who created/updated the compliance record
    if (filters.createdBy) {
      conditions.push(`cr.created_by = $${i}`);
      params.push(filters.createdBy);
      i++;
    }

    if (filters.updatedBy) {
      conditions.push(`cr.updated_by = $${i}`);
      params.push(filters.updatedBy);
      i++;
    }

    if (filters.createdAfter) {
      conditions.push(`cr.created_at >= $${i}`);
      params.push(filters.createdAfter);
      i++;
    }

    if (filters.createdBefore) {
      conditions.push(`cr.created_at <= $${i}`);
      params.push(filters.createdBefore);
      i++;
    }

    if (filters.updatedAfter) {
      conditions.push(`cr.updated_at >= $${i}`);
      params.push(filters.updatedAfter);
      i++;
    }

    if (filters.updatedBefore) {
      conditions.push(`cr.updated_at <= $${i}`);
      params.push(filters.updatedBefore);
      i++;
    }

    // ----------------------------------------
    // SKU-level filters (s.*)
    // ----------------------------------------
    if (filters.skuIds?.length > 0) {
      conditions.push(`s.id = ANY($${i})`);
      params.push(filters.skuIds);
      i++;
    }

    if (filters.sku) {
      conditions.push(`s.sku ILIKE $${i}`);
      params.push(`%${filters.sku}%`);
      i++;
    }

    if (filters.sizeLabel) {
      conditions.push(`s.size_label ILIKE $${i}`);
      params.push(`%${filters.sizeLabel}%`);
      i++;
    }

    if (filters.marketRegion) {
      conditions.push(`s.market_region ILIKE $${i}`);
      params.push(`%${filters.marketRegion}%`);
      i++;
    }

    // ----------------------------------------
    // Product-level filters (p.*)
    // ----------------------------------------
    if (filters.productName) {
      conditions.push(`p.name ILIKE $${i}`);
      params.push(`%${filters.productName}%`);
      i++;
    }

    if (filters.brand) {
      conditions.push(`p.brand ILIKE $${i}`);
      params.push(`%${filters.brand}%`);
      i++;
    }

    if (filters.category) {
      conditions.push(`p.category ILIKE $${i}`);
      params.push(`%${filters.category}%`);
      i++;
    }

    // ----------------------------------------
    // Keyword search (multi-field fuzzy)
    // ----------------------------------------
    if (filters.keyword) {
      conditions.push(`(
        cr.compliance_id ILIKE $${i} OR
        s.sku ILIKE $${i} OR
        p.name ILIKE $${i} OR
        p.brand ILIKE $${i} OR
        p.category ILIKE $${i}
      )`);
      params.push(`%${filters.keyword}%`);
      i++;
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
