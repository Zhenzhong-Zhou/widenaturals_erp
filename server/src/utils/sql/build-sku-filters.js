/**
 * @fileoverview build-sku-filter.js
 * Utility to dynamically construct SQL WHERE clauses and parameter arrays for filtering SKUs and products.
 * Used in repository layers to support paginated list views or dropdowns with flexible filtering and optional stock checks.
 */

const { normalizeDateRangeFilters, applyDateRangeConditions } = require('./date-range-utils');
const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');
const { addIlikeFilter } = require('./sql-helpers');

/**
 * Builds SQL WHERE clause + parameter array for SKU Product-Card listing.
 *
 * Filters are already ACL-adjusted by the service layer:
 *   - productName / brand / category
 *   - sku / sizeLabel / marketRegion
 *   - productStatusId / skuStatusId
 *   - skuIds
 *   - complianceId
 *   - keyword (multi-field fuzzy match)
 *
 * Returned output can be injected into the repository query.
 *
 * @param {Object} filters - Normalized filter values.
 * @param {string} [filters.productName]
 * @param {string} [filters.brand]
 * @param {string} [filters.category]
 * @param {string} [filters.productStatusId]
 * @param {string} [filters.sku]
 * @param {string[]} [filters.skuIds]
 * @param {string} [filters.sizeLabel]
 * @param {string} [filters.countryCode]
 * @param {string} [filters.marketRegion]
 * @param {string} [filters.skuStatusId]
 * @param {string} [filters.complianceId]
 * @param {string} [filters.keyword]
 *
 * @returns {{
 *   whereClause: string,
 *   params: any[]
 * }} SQL-safe condition string + params.
 */
const buildSkuProductCardFilters = (filters = {}) => {
  try {
    /** @type {string[]} */
    const conditions = ['1=1'];

    /** @type {any[]} */
    const params = [];

    /** @type {number} */
    let idx = 1;

    // -------------------------------------------------------------
    // PRODUCT filters (ILIKE)
    // -------------------------------------------------------------
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.productName,
      'p.name'
    );
    idx = addIlikeFilter(conditions, params, idx, filters.brand, 'p.brand');
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.category,
      'p.category'
    );

    if (filters.productStatusId) {
      conditions.push(`p.status_id = $${idx}`);
      params.push(filters.productStatusId);
      idx++;
    }

    // -------------------------------------------------------------
    // SKU filters (ILIKE + UUID array)
    // -------------------------------------------------------------
    idx = addIlikeFilter(conditions, params, idx, filters.sku, 's.sku');
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.sizeLabel,
      's.size_label'
    );
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.countryCode,
      's.country_code'
    );
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.marketRegion,
      's.market_region'
    );

    if (filters.skuIds) {
      if (Array.isArray(filters.skuIds)) {
        conditions.push(`s.id = ANY($${idx}::uuid[])`);
      } else {
        conditions.push(`s.id = $${idx}`);
      }
      params.push(filters.skuIds);
      idx++;
    }

    if (filters.skuStatusId) {
      conditions.push(`s.status_id = $${idx}`);
      params.push(filters.skuStatusId);
      idx++;
    }

    // -------------------------------------------------------------
    // COMPLIANCE filters
    // -------------------------------------------------------------
    idx = addIlikeFilter(
      conditions,
      params,
      idx,
      filters.complianceId,
      'cr.compliance_id'
    );

    // -------------------------------------------------------------
    // KEYWORD search (multi-field)
    // -------------------------------------------------------------
    if (filters.keyword) {
      /** @type {string} */
      const kw = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;

      conditions.push(`
        (
          p.name ILIKE $${idx}
          OR p.brand ILIKE $${idx}
          OR p.category ILIKE $${idx}
          OR s.sku ILIKE $${idx}
          OR cr.compliance_id ILIKE $${idx}
        )
      `);

      params.push(kw);
      idx++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build SKU Product Card filter', {
      context: 'sku-repository/buildSkuProductCardFilters',
      error: err.message,
      filters,
    });

    throw AppError.databaseError('Failed to build SKU card filter conditions', {
      details: err.message,
    });
  }
};

/**
 * Builds a dynamic SQL WHERE clause and parameters array for filtering SKU and product records.
 *
 * Enforces `productStatusId` by default (unless `allowAllSkus` is true), ensuring only active items are included.
 * Supports standard filters like brand, category, region, size label, and keyword.
 * Optionally applies inventory availability constraints based on warehouse or location inventory.
 *
 * @param {string} productStatusId - UUID of the 'active' product status to apply (unless `allowAllSkus` is true).
 * @param {Object} [filters={}] - Filtering options.
 * @param {string} [filters.brand] - Filter by product brand.
 * @param {string} [filters.category] - Filter by product category.
 * @param {string} [filters.marketRegion] - Filter by SKU market region.
 * @param {string} [filters.sizeLabel] - Filter by SKU size label.
 * @param {string} [filters.keyword] - Keyword to search against SKU, barcode, product name, and size.
 * @param {Function} keywordHandler - Function that returns SQL condition and values for keyword search.
 * @param {Object} [options={}] - Advanced filtering options.
 * @param {boolean} [options.requireAvailableStock=false] - If true, adds stock availability constraints.
 * @param {string} [options.requireAvailableStockFrom='warehouse'] - One of: 'warehouse', 'location', or 'both'.
 * @param {string} [options.batchStatusId] - Batch status UUID to constrain batch-based inventory joins.
 * @param {string} [options.inventoryStatusId] - Inventory status UUID to constrain inventory joins.
 * @param {string} [options.warehouseId] - Optional warehouse UUID filter for warehouse inventory check.
 * @param {string} [options.locationId] - Optional location UUID filter for location inventory check.
 * @param {boolean} [options.allowAllSkus=false] - If true, skips enforcing `productStatusId` and stock constraints.
 *
 * @returns {{ whereClause: string, params: Array<any> }} An SQL-safe WHERE clause string and corresponding parameter values.
 */
const buildWhereClauseAndParams = (
  productStatusId,
  filters = {},
  keywordHandler,
  options = {}
) => {
  try {
    const stockSource = options.requireAvailableStockFrom ?? 'warehouse';
    const fieldMap = SORTABLE_FIELDS.skuProductCards;
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (!options.allowAllSkus) {
      if (!productStatusId) {
        throw AppError.validationError(
          'productStatusId is required when allowAllSkus is false'
        );
      }

      // Enforce active status filtering when not bypassing
      conditions.push(`p.status_id = $${paramIndex}`);
      conditions.push(`s.status_id = $${paramIndex}`);
      params.push(productStatusId);
      paramIndex++;
    }

    // Basic filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        const field = fieldMap[key];
        if (!field && key !== 'keyword') continue;

        if (key === 'keyword') {
          if (typeof keywordHandler === 'function') {
            const { condition, values } = keywordHandler(value, paramIndex);
            if (condition) {
              conditions.push(condition);
              params.push(...values);
              paramIndex += values.length;
            }
          } else {
            conditions.push(`${field} ILIKE $${paramIndex}`);
            params.push(`%${value}%`);
            paramIndex++;
          }
        } else {
          conditions.push(`${field} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      }
    }

    // Conditional EXISTS clauses for stock availability
    const existsClauses = [];

    if (
      options.requireAvailableStock &&
      !options.allowAllSkus &&
      (stockSource === 'warehouse' || stockSource === 'both')
    ) {
      const warehouseAlias = 'wi';
      const batchAlias = 'br';
      const productBatchAlias = 'pb';

      let clause = `
        EXISTS (
          SELECT 1
          FROM warehouse_inventory ${warehouseAlias}
          JOIN batch_registry ${batchAlias} ON ${batchAlias}.id = ${warehouseAlias}.batch_id
          JOIN product_batches ${productBatchAlias} ON ${batchAlias}.product_batch_id = ${productBatchAlias}.id
          WHERE ${productBatchAlias}.sku_id = s.id
            AND ${warehouseAlias}.warehouse_quantity > 0
      `;

      if (options.batchStatusId) {
        clause += ` AND ${productBatchAlias}.status_id = $${paramIndex++}`;
        params.push(options.batchStatusId);
      }

      if (options.inventoryStatusId) {
        clause += ` AND ${warehouseAlias}.status_id = $${paramIndex++}`;
        params.push(options.inventoryStatusId);
      }

      if (options.warehouseId) {
        clause += ` AND ${warehouseAlias}.warehouse_id = $${paramIndex++}`;
        params.push(options.warehouseId);
      }

      clause += `)`;
      existsClauses.push(clause);
    }

    if (
      options.requireAvailableStock &&
      !options.allowAllSkus &&
      (stockSource === 'location' || stockSource === 'both')
    ) {
      const locInvAlias = 'li';
      const batchAlias = 'br2';
      const productBatchAlias = 'pb2';

      let clause = `
        EXISTS (
          SELECT 1
          FROM location_inventory ${locInvAlias}
          JOIN batch_registry ${batchAlias} ON ${batchAlias}.id = ${locInvAlias}.batch_id
          JOIN product_batches ${productBatchAlias} ON ${batchAlias}.product_batch_id = ${productBatchAlias}.id
          WHERE ${productBatchAlias}.sku_id = s.id
            AND ${locInvAlias}.location_quantity > 0
      `;

      if (options.batchStatusId) {
        clause += ` AND ${productBatchAlias}.status_id = $${paramIndex++}`;
        params.push(options.batchStatusId);
      }

      if (options.inventoryStatusId) {
        clause += ` AND ${locInvAlias}.status_id = $${paramIndex++}`;
        params.push(options.inventoryStatusId);
      }

      if (options.locationId) {
        clause += ` AND ${locInvAlias}.location_id = $${paramIndex++}`;
        params.push(options.locationId);
      }

      clause += `)`;
      existsClauses.push(clause);
    }

    if (existsClauses.length > 0) {
      conditions.push(`(${existsClauses.join(' OR ')})`);
    }

    // If no condition and allowAllSkus is true, fallback to `1=1`
    const whereClause =
      conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    return { whereClause, params };
  } catch (err) {
    logSystemException(err, 'Failed to construct WHERE clause', {
      context: 'sku-repository/buildWhereClauseAndParams',
      error: err.message,
      filters,
      productStatusId,
    });
    throw AppError.transformerError('Failed to prepare filter conditions', {
      details: err.message,
      stage: 'build-where-clause',
    });
  }
};

/**
 * Default keyword handler for SKU/product filtering.
 *
 * Constructs a condition that performs case-insensitive partial matches
 * against SKU, barcode, product name, and SKU size label.
 *
 * @param {string} keyword - The keyword value to search for.
 * @param {number} paramIndex - The current positional parameter index (for SQL parameter binding).
 * @returns {{ condition: string, values: string[] }} SQL WHERE condition and the corresponding parameter array.
 */
const skuDropdownKeywordHandler = (keyword, paramIndex) => {
  const trimmed = keyword.trim().toLowerCase();
  const param = `%${trimmed}%`;

  const condition = `(
    LOWER(s.sku) LIKE $${paramIndex} OR
    LOWER(s.barcode) LIKE $${paramIndex} OR
    LOWER(p.name) LIKE $${paramIndex} OR
    LOWER(s.size_label) LIKE $${paramIndex}
  )`;

  return {
    condition,
    values: [param],
  };
};

/**
 * Build WHERE clause + params for SKU list queries.
 *
 * ### Supported Filters
 * - **SKU-level (`s`):**
 *   - `statusIds[]`
 *   - `sizeLabel`
 *   - `marketRegion`
 *   - `productIds[]`
 *   - `sku` partial match
 *   - dimensional filters (length/width/height/weight)
 *   - date ranges: created_at / updated_at
 *   - createdBy / updatedBy (UUID)
 *
 * - **Product-level (`p`):**
 *   - `productName` (ILIKE)
 *   - `brand`
 *   - `category`
 *
 * - **Keyword fuzzy search**
 *   - matches: `s.sku`, `p.name`, `p.brand`, `p.category`
 *
 * ### Return:
 * {
 *   whereClause: '1=1 AND s.status_id = ANY($1) ...',
 *   params: [...]
 * }
 *
 * @param {Object} [filters={}] - Optional filtering criteria object.
 * @param {string[]} [filters.statusIds] - Filter by SKU status UUID(s).
 * @param {string[]} [filters.productIds] - Filter by linked product UUID(s).
 * @param {string} [filters.sizeLabel] - Filter by SKU size label (e.g., "60 Capsules").
 * @param {string} [filters.marketRegion] - Filter by region code (e.g., "CA", "US", "HK").
 * @param {string} [filters.sku] - Partial match against SKU code.
 * @param {number} [filters.minLengthCm] - Minimum product length in centimeters (cm).
 * @param {number} [filters.maxLengthCm] - Maximum product length in centimeters (cm).
 * @param {number} [filters.minLengthIn] - Minimum product length in inches (in).
 * @param {number} [filters.maxLengthIn] - Maximum product length in inches (in).
 * @param {number} [filters.minWidthCm] - Minimum product width in centimeters (cm).
 * @param {number} [filters.maxWidthCm] - Maximum product width in centimeters (cm).
 * @param {number} [filters.minWidthIn] - Minimum product width in inches (in).
 * @param {number} [filters.maxWidthIn] - Maximum product width in inches (in).
 * @param {number} [filters.minHeightCm] - Minimum product height in centimeters (cm).
 * @param {number} [filters.maxHeightCm] - Maximum product height in centimeters (cm).
 * @param {number} [filters.minHeightIn] - Minimum product height in inches (in).
 * @param {number} [filters.maxHeightIn] - Maximum product height in inches (in).
 * @param {number} [filters.minWeightG] - Minimum product weight in grams (g).
 * @param {number} [filters.maxWeightG] - Maximum product weight in grams (g).
 * @param {number} [filters.minWeightLb] - Minimum product weight in pounds (lb).
 * @param {number} [filters.maxWeightLb] - Maximum product weight in pounds (lb).
 * @param {string} [filters.createdBy] - Filter by UUID of user who created the SKU.
 * @param {string} [filters.updatedBy] - Filter by UUID of last updater.
 * @param {string} [filters.createdAfter] - Lower bound for created_at ISO timestamp.
 * @param {string} [filters.createdBefore] - Upper bound for created_at ISO timestamp.
 * @param {string} [filters.updatedAfter] - Lower bound for updated_at ISO timestamp.
 * @param {string} [filters.updatedBefore] - Upper bound for updated_at ISO timestamp.
 * @param {string} [filters.productName] - ILIKE filter over related product name.
 * @param {string} [filters.brand] - ILIKE filter over product brand.
 * @param {string} [filters.category] - ILIKE filter over product category.
 * @param {string} [filters.keyword] - Fuzzy match across SKU + product fields.
 *
 * @returns {{ whereClause: string, params: any[] }}
 * SQL-safe WHERE clause (string) and parameter array for prepared statements.
 */
const buildSkuFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date-only filters
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore');
    filters = normalizeDateRangeFilters(filters, 'updatedAfter', 'updatedBefore');
    
    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };
    
    // ------------------------------
    // SKU-level filters
    // ------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`s.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }
    
    if (filters.productIds?.length) {
      conditions.push(`s.product_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.productIds);
      paramIndexRef.value++;
    }
    
    if (filters.marketRegion) {
      conditions.push(`s.market_region ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.marketRegion}%`);
      paramIndexRef.value++;
    }
    
    if (filters.sizeLabel) {
      conditions.push(`s.size_label ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.sizeLabel}%`);
      paramIndexRef.value++;
    }
    
    if (filters.sku) {
      conditions.push(`s.sku ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.sku}%`);
      paramIndexRef.value++;
    }
    
    // ----------------------------------------------------
    // Dimensional filters (unchanged semantics)
    // ----------------------------------------------------
    const rangeFilters = [
      ['minLengthCm', 's.length_cm >='],
      ['maxLengthCm', 's.length_cm <='],
      ['minLengthIn', 's.length_inch >='],
      ['maxLengthIn', 's.length_inch <='],
      ['minWidthCm', 's.width_cm >='],
      ['maxWidthCm', 's.width_cm <='],
      ['minWidthIn', 's.width_inch >='],
      ['maxWidthIn', 's.width_inch <='],
      ['minHeightCm', 's.height_cm >='],
      ['maxHeightCm', 's.height_cm <='],
      ['minHeightIn', 's.height_inch >='],
      ['maxHeightIn', 's.height_inch <='],
      ['minWeightG', 's.weight_g >='],
      ['maxWeightG', 's.weight_g <='],
      ['minWeightLb', 's.weight_lb >='],
      ['maxWeightLb', 's.weight_lb <='],
    ];
    
    for (const [key, sql] of rangeFilters) {
      if (filters[key] !== undefined) {
        conditions.push(`${sql} $${paramIndexRef.value}`);
        params.push(filters[key]);
        paramIndexRef.value++;
      }
    }
    
    // ------------------------------
    // Audit filters
    // ------------------------------
    if (filters.createdBy) {
      conditions.push(`s.created_by = $${paramIndexRef.value}`);
      params.push(filters.createdBy);
      paramIndexRef.value++;
    }
    
    if (filters.updatedBy) {
      conditions.push(`s.updated_by = $${paramIndexRef.value}`);
      params.push(filters.updatedBy);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Created / Updated date filters
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 's.created_at',
      after: filters.createdAfter,
      before: filters.createdBefore,
      paramIndexRef,
    });
    
    applyDateRangeConditions({
      conditions,
      params,
      column: 's.updated_at',
      after: filters.updatedAfter,
      before: filters.updatedBefore,
      paramIndexRef,
    });
    
    // ------------------------------
    // Product-level filters
    // ------------------------------
    if (filters.productName) {
      conditions.push(`p.name ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.productName}%`);
      paramIndexRef.value++;
    }
    
    // ------------------------------
    // Keyword fuzzy search
    // ------------------------------
    if (filters.keyword) {
      conditions.push(`(
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
    logSystemException(err, 'Failed to build SKU filter', {
      context: 'sku-repository/buildSkuFilter',
      filters,
    });
    
    throw AppError.databaseError('Failed to prepare SKU filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildSkuProductCardFilters,
  buildWhereClauseAndParams,
  skuDropdownKeywordHandler,
  buildSkuFilter,
};
