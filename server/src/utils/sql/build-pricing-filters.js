/**
 * @fileoverview
 * Utility to dynamically build an SQL `WHERE` clause and associated parameters
 * for querying pricing records, suitable for both lookup dropdowns and admin-level queries.
 *
 * Supports a wide range of filters, including direct field matches, keyword search,
 * temporal validity checks, and product/SKU enrichment metadata.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a dynamic SQL WHERE clause and parameters array based on provided pricing filters.
 *
 * ### Supported Filters
 * **Exact match fields** (join-safe):
 * - `skuId`: SKU ID to filter specific SKUs (`p.sku_id`)
 * - `priceTypeId`: Pricing type ID (`p.price_type_id`)
 * - `locationId`: Location ID (`p.location_id`)
 * - `statusId`: Pricing status ID (`p.status_id`)
 * - `createdBy`, `updatedBy`: User UUIDs for metadata audit fields
 *
 * **Lookup enrichment filters** (require proper JOINs):
 * - `brand`: Product brand (`pr.brand`)
 * - `pricingType`: Pricing type name (`pt.name`)
 * - `countryCode`: SKU country code (`s.country_code`)
 * - `sizeLabel`: SKU size label (`s.size_label`)
 *
 * **Temporal filters**:
 * - `validFrom`: Only include prices starting on or after this timestamp
 * - `validTo`: Only include prices ending on or before this timestamp
 * - `validOn`: Include only prices valid at this specific timestamp
 * - `currentlyValid`: Shortcut to filter prices that are valid at `NOW()`
 * - `createdAfter`, `createdBefore`: Filter by `created_at` timestamp
 *
 * **Keyword search**:
 * - `keyword`: Fuzzy match across product name (`pr.name`), SKU (`s.sku`), or pricing type (`pt.name`)
 *
 * **Special Flags**:
 * - `_restrictKeywordToValidOnly`: Enforces current validity for keyword usage
 *
 * @param {Object} filters - Optional filter fields.
 * @param {string} [filters.skuId] - Match by SKU ID.
 * @param {string} [filters.priceTypeId] - Match by pricing type ID.
 * @param {string} [filters.locationId] - Match by location ID.
 * @param {string} [filters.statusId] - Match by pricing status ID.
 * @param {string} [filters.brand] - Match by product brand.
 * @param {string} [filters.pricingType] - Match by pricing type name.
 * @param {string} [filters.countryCode] - Match by SKU country code.
 * @param {string} [filters.sizeLabel] - Match by SKU size label.
 * @param {string} [filters.validFrom] - Match records starting on or after this date.
 * @param {string} [filters.validTo] - Match records ending on or before this date.
 * @param {string} [filters.validOn] - Match records valid at this specific timestamp.
 * @param {boolean} [filters.currentlyValid] - Restrict to currently active pricing based on NOW().
 * @param {string} [filters.createdAfter] - Match records created on or after this timestamp.
 * @param {string} [filters.createdBefore] - Match records created on or before this timestamp.
 * @param {string} [filters.createdBy] - Match by creator user ID.
 * @param {string} [filters.updatedBy] - Match by updater user ID.
 * @param {boolean} [filters._restrictKeywordToValidOnly] - Internal flag to restrict keyword filtering to currently valid pricing.
 * @param {string} [filters.keyword] - Optional keyword for fuzzy match on product name, SKU, or pricing type.
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL WHERE clause string and bound parameter values.
 *
 * @throws {AppError} If filter construction fails due to unexpected input.
 *
 * @example
 * const { whereClause, params } = buildPricingFilters(
 *   { brand: 'Canaherb', currentlyValid: true },
 *   'NMN 3000'
 * );
 * const query = `SELECT * FROM pricing p
 *   JOIN products pr ON p.product_id = pr.id
 *   JOIN skus s ON p.sku_id = s.id
 *   JOIN pricing_types pt ON p.price_type_id = pt.id
 *   WHERE ${whereClause}`;
 * db.query(query, params);
 */
const buildPricingFilters = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    const keywordStr = String(filters.keyword ?? '').trim();
    const keywordUsed = keywordStr.length > 0;
    
    // === 1. Standard filters ===
    
    if (filters.skuId) {
      conditions.push(`p.sku_id = $${paramIndex}`);
      params.push(filters.skuId);
      paramIndex++;
    }
    
    if (filters.priceTypeId) {
      conditions.push(`p.price_type_id = $${paramIndex}`);
      params.push(filters.priceTypeId);
      paramIndex++;
    }
    
    if (filters.locationId) {
      conditions.push(`p.location_id = $${paramIndex}`);
      params.push(filters.locationId);
      paramIndex++;
    }
    
    if (filters.statusId) {
      conditions.push(`p.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    }
    
    if (filters.brand) {
      params.push(filters.brand);
      conditions.push(`pr.brand = $${params.length}`);
    }
    
    if (filters.pricingType) {
      params.push(filters.pricingType);
      conditions.push(`pt.name = $${params.length}`);
    }
    
    if (filters.countryCode) {
      params.push(filters.countryCode);
      conditions.push(`s.country_code = $${params.length}`);
    }
    
    if (filters.sizeLabel) {
      params.push(filters.sizeLabel);
      conditions.push(`s.size_label = $${params.length}`);
    }
    
    if (filters.validFrom && filters.validTo) {
      params.push(filters.validFrom);
      conditions.push(`p.valid_from >= $${params.length}`);
      
      params.push(filters.validTo);
      conditions.push(`p.valid_to <= $${params.length}`);
    }
    
    // === 2. Keyword filter ===
    
    if (keywordUsed) {
      const keywordParam = `%${filters.keyword.trim()}%`;
      params.push(keywordParam);
      conditions.push(`(
        pr.name ILIKE $${params.length} OR
        s.sku ILIKE $${params.length} OR
        pt.name ILIKE $${params.length}
      )`);
    }
    
    // === 3. Enforced validity (via _restrictKeywordToValidOnly or filters.currentlyValid) ===
    
    if (filters._restrictKeywordToValidOnly || filters.currentlyValid) {
      conditions.push(`p.valid_from <= NOW()`);
      conditions.push(`(p.valid_to IS NULL OR p.valid_to >= NOW())`);
    }
    
    // === 4. Optional date range filters ===
    
    if (filters.validFrom) {
      conditions.push(`p.valid_from >= $${paramIndex}`);
      params.push(filters.validFrom);
      paramIndex++;
    }
    
    if (filters.validTo) {
      conditions.push(`p.valid_to <= $${paramIndex}`);
      params.push(filters.validTo);
      paramIndex++;
    }
    
    if (filters.validOn) {
      conditions.push(`(
        p.valid_from <= $${paramIndex} AND
        (p.valid_to IS NULL OR p.valid_to >= $${paramIndex})
      )`);
      params.push(filters.validOn);
      paramIndex++;
    }
    
    // === 5. Metadata ===
    
    if (filters.createdAfter) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(filters.createdAfter);
      paramIndex++;
    }
    
    if (filters.createdBefore) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(filters.createdBefore);
      paramIndex++;
    }
    
    if (filters.createdBy) {
      conditions.push(`p.created_by = $${paramIndex}`);
      params.push(filters.createdBy);
      paramIndex++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`p.updated_by = $${paramIndex}`);
      params.push(filters.updatedBy);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build pricing filter', {
      context: 'pricing-repository/buildPricingFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare pricing filter', {
      details: err.message,
      stage: 'build-pricing-where-clause',
    });
  }
};

module.exports = {
  buildPricingFilters,
};
