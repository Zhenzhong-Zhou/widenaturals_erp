/**
 * @file build-sku-filter.js
 * @description SQL WHERE clause builders for SKU queries.
 *
 * Pure functions — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * Exports:
 *  - buildSkuProductCardFilters  — WHERE clause for paginated product card query
 *  - buildWhereClauseAndParams   — WHERE clause for SKU dropdown/lookup query
 *  - skuDropdownKeywordHandler   — keyword condition factory for dropdown query
 *  - buildSkuFilter              — WHERE clause for paginated SKU list query
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { addIlikeFilter } = require('./sql-helpers');
const AppError = require('../AppError');

// ─── Product Card Filter ──────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for the SKU product card query.
 *
 * @param {Object}   [filters={}]
 * @param {string}   [filters.productName]      - ILIKE filter on product name.
 * @param {string}   [filters.brand]            - ILIKE filter on brand.
 * @param {string}   [filters.category]         - ILIKE filter on category.
 * @param {string}   [filters.productStatusId]  - Exact match on product status UUID.
 * @param {string}   [filters.sku]              - ILIKE filter on SKU code.
 * @param {string}   [filters.sizeLabel]        - ILIKE filter on size label.
 * @param {string}   [filters.countryCode]      - ILIKE filter on country code.
 * @param {string}   [filters.marketRegion]     - ILIKE filter on market region.
 * @param {string|string[]} [filters.skuIds]    - Exact match on SKU UUID(s).
 * @param {string}   [filters.skuStatusId]      - Exact match on SKU status UUID.
 * @param {string}   [filters.complianceId]     - ILIKE filter on compliance id.
 * @param {string}   [filters.keyword]          - Fuzzy search across product, SKU, compliance fields.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildSkuProductCardFilters = (filters = {}) => {
  /** @type {string[]} */
  const conditions = ['1=1'];
  
  /** @type {any[]} */
  const params = [];
  
  /** @type {number} */
  let idx = 1;
  
  // ─── Product filters ─────────────────────────────────────────────────────────
  
  idx = addIlikeFilter(conditions, params, idx, filters.productName, 'p.name');
  idx = addIlikeFilter(conditions, params, idx, filters.brand, 'p.brand');
  idx = addIlikeFilter(conditions, params, idx, filters.category, 'p.category');
  
  if (filters.productStatusId) {
    conditions.push(`p.status_id = $${idx}`);
    params.push(filters.productStatusId);
    idx++;
  }
  
  // ─── SKU filters ─────────────────────────────────────────────────────────────
  
  idx = addIlikeFilter(conditions, params, idx, filters.sku, 's.sku');
  idx = addIlikeFilter(conditions, params, idx, filters.sizeLabel, 's.size_label');
  idx = addIlikeFilter(conditions, params, idx, filters.countryCode, 's.country_code');
  idx = addIlikeFilter(conditions, params, idx, filters.marketRegion, 's.market_region');
  
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
  
  // ─── Compliance filters ───────────────────────────────────────────────────────
  
  idx = addIlikeFilter(conditions, params, idx, filters.complianceId, 'cr.compliance_id');
  
  // ─── Keyword search ───────────────────────────────────────────────────────────
  
  if (filters.keyword) {
    const kw = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;
    conditions.push(`(
      p.name          ILIKE $${idx} OR
      p.brand         ILIKE $${idx} OR
      p.category      ILIKE $${idx} OR
      s.sku           ILIKE $${idx} OR
      cr.compliance_id ILIKE $${idx}
    )`);
    params.push(kw);
    idx++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

// ─── Dropdown / Lookup Filter ─────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for the SKU dropdown/lookup query.
 *
 * When allowAllSkus is false, productStatusId is required and active status
 * filtering is enforced on both the product and SKU rows.
 *
 * @param {string}   productStatusId        - Active status UUID; required when allowAllSkus is false.
 * @param {Object}   [filters={}]           - Field filters keyed by skuProductCards sort map.
 * @param {Function} [keywordHandler]       - Custom keyword condition factory.
 * @param {Object}   [options={}]
 * @param {boolean}  [options.allowAllSkus] - If true, skips status enforcement.
 * @param {boolean}  [options.requireAvailableStock]
 * @param {string}   [options.requireAvailableStockFrom] - 'warehouse' | 'location' | 'both'
 * @param {string}   [options.batchStatusId]
 * @param {string}   [options.inventoryStatusId]
 * @param {string}   [options.warehouseId]
 * @param {string}   [options.locationId]
 *
 * @returns {{ whereClause: string, params: Array }}
 * @throws  {AppError} Validation error if productStatusId is absent when required.
 */
const buildWhereClauseAndParams = (
  productStatusId,
  filters = {},
  keywordHandler,
  options = {}
) => {
  const stockSource = options.requireAvailableStockFrom ?? 'warehouse';
  const fieldMap    = SORTABLE_FIELDS.skuProductCards;
  const conditions  = [];
  const params      = [];
  let paramIndex    = 1;
  
  if (!options.allowAllSkus) {
    if (!productStatusId) {
      throw AppError.validationError(
        'productStatusId is required when allowAllSkus is false'
      );
    }
    
    conditions.push(`p.status_id = $${paramIndex}`);
    conditions.push(`s.status_id = $${paramIndex}`);
    params.push(productStatusId);
    paramIndex++;
  }
  
  // ─── Basic field filters ──────────────────────────────────────────────────────
  
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    
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
  
  // ─── Stock availability EXISTS clauses ────────────────────────────────────────
  
  const existsClauses = [];
  
  if (options.requireAvailableStock && !options.allowAllSkus) {
    if (stockSource === 'warehouse' || stockSource === 'both') {
      let clause = `
        EXISTS (
          SELECT 1
          FROM warehouse_inventory wi
          JOIN batch_registry br       ON br.id = wi.batch_id
          JOIN product_batches pb      ON br.product_batch_id = pb.id
          WHERE pb.sku_id = s.id
            AND wi.warehouse_quantity > 0
      `;
      
      if (options.batchStatusId) {
        clause += ` AND pb.status_id = $${paramIndex++}`;
        params.push(options.batchStatusId);
      }
      
      if (options.inventoryStatusId) {
        clause += ` AND wi.status_id = $${paramIndex++}`;
        params.push(options.inventoryStatusId);
      }
      
      if (options.warehouseId) {
        clause += ` AND wi.warehouse_id = $${paramIndex++}`;
        params.push(options.warehouseId);
      }
      
      clause += `)`;
      existsClauses.push(clause);
    }
    
    if (stockSource === 'location' || stockSource === 'both') {
      let clause = `
        EXISTS (
          SELECT 1
          FROM location_inventory li
          JOIN batch_registry br       ON br.id = li.batch_id
          JOIN product_batches pb      ON br.product_batch_id = pb.id
          WHERE pb.sku_id = s.id
            AND li.location_quantity > 0
      `;
      
      if (options.batchStatusId) {
        clause += ` AND pb.status_id = $${paramIndex++}`;
        params.push(options.batchStatusId);
      }
      
      if (options.inventoryStatusId) {
        clause += ` AND li.status_id = $${paramIndex++}`;
        params.push(options.inventoryStatusId);
      }
      
      if (options.locationId) {
        clause += ` AND li.location_id = $${paramIndex++}`;
        params.push(options.locationId);
      }
      
      clause += `)`;
      existsClauses.push(clause);
    }
  }
  
  if (existsClauses.length > 0) {
    conditions.push(`(${existsClauses.join(' OR ')})`);
  }
  
  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  
  return { whereClause, params };
};

// ─── Dropdown Keyword Handler ─────────────────────────────────────────────────

/**
 * Produces a keyword LIKE condition across sku, barcode, product name, and size label.
 *
 * @param {string} keyword    - Raw keyword value from filters.
 * @param {number} paramIndex - Current positional parameter index.
 * @returns {{ condition: string, values: Array }}
 */
const skuDropdownKeywordHandler = (keyword, paramIndex) => {
  const param = `%${keyword.trim().toLowerCase()}%`;
  
  const condition = `(
    LOWER(s.sku)        LIKE $${paramIndex} OR
    LOWER(s.barcode)    LIKE $${paramIndex} OR
    LOWER(p.name)       LIKE $${paramIndex} OR
    LOWER(s.size_label) LIKE $${paramIndex}
  )`;
  
  return { condition, values: [param] };
};

// ─── Paginated SKU List Filter ────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for the paginated SKU list query.
 *
 * Normalizes date range filters to UTC ISO boundaries before applying conditions.
 *
 * @param {Object}   [filters={}]
 * @param {string[]} [filters.statusIds]      - Filter by SKU status UUIDs.
 * @param {string[]} [filters.productIds]     - Filter by product UUIDs.
 * @param {string}   [filters.marketRegion]   - ILIKE filter on market region.
 * @param {string}   [filters.sizeLabel]      - ILIKE filter on size label.
 * @param {string}   [filters.sku]            - ILIKE filter on SKU code.
 * @param {number}   [filters.minLengthCm]    - Minimum length in cm (inclusive).
 * @param {number}   [filters.maxLengthCm]    - Maximum length in cm (inclusive).
 * @param {number}   [filters.minLengthIn]    - Minimum length in inches (inclusive).
 * @param {number}   [filters.maxLengthIn]    - Maximum length in inches (inclusive).
 * @param {number}   [filters.minWidthCm]     - Minimum width in cm (inclusive).
 * @param {number}   [filters.maxWidthCm]     - Maximum width in cm (inclusive).
 * @param {number}   [filters.minWidthIn]     - Minimum width in inches (inclusive).
 * @param {number}   [filters.maxWidthIn]     - Maximum width in inches (inclusive).
 * @param {number}   [filters.minHeightCm]    - Minimum height in cm (inclusive).
 * @param {number}   [filters.maxHeightCm]    - Maximum height in cm (inclusive).
 * @param {number}   [filters.minHeightIn]    - Minimum height in inches (inclusive).
 * @param {number}   [filters.maxHeightIn]    - Maximum height in inches (inclusive).
 * @param {number}   [filters.minWeightG]     - Minimum weight in grams (inclusive).
 * @param {number}   [filters.maxWeightG]     - Maximum weight in grams (inclusive).
 * @param {number}   [filters.minWeightLb]    - Minimum weight in lbs (inclusive).
 * @param {number}   [filters.maxWeightLb]    - Maximum weight in lbs (inclusive).
 * @param {string}   [filters.createdBy]      - Filter by creator user UUID.
 * @param {string}   [filters.updatedBy]      - Filter by updater user UUID.
 * @param {string}   [filters.createdAfter]   - Lower bound for created_at (inclusive, UTC).
 * @param {string}   [filters.createdBefore]  - Upper bound for created_at (exclusive, UTC).
 * @param {string}   [filters.updatedAfter]   - Lower bound for updated_at (inclusive, UTC).
 * @param {string}   [filters.updatedBefore]  - Upper bound for updated_at (exclusive, UTC).
 * @param {string}   [filters.productName]    - ILIKE filter on product name.
 * @param {string}   [filters.keyword]        - Fuzzy search across sku, product, brand, category.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildSkuFilter = (filters = {}) => {
  // Normalize date ranges into UTC ISO boundaries — handles both raw date
  // strings and Date objects coerced by Joi's date() type.
  const normalizedFilters = normalizeDateRangeFilters(
    normalizeDateRangeFilters(filters, 'createdAfter', 'createdBefore'),
    'updatedAfter',
    'updatedBefore'
  );
  
  const conditions    = ['1=1'];
  const params        = [];
  const paramIndexRef = { value: 1 };
  
  // ─── SKU-level filters ────────────────────────────────────────────────────────
  
  if (normalizedFilters.statusIds?.length) {
    conditions.push(`s.status_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.statusIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.productIds?.length) {
    conditions.push(`s.product_id = ANY($${paramIndexRef.value}::uuid[])`);
    params.push(normalizedFilters.productIds);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.marketRegion) {
    conditions.push(`s.market_region ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.marketRegion}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.sizeLabel) {
    conditions.push(`s.size_label ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.sizeLabel}%`);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.sku) {
    conditions.push(`s.sku ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.sku}%`);
    paramIndexRef.value++;
  }
  
  // ─── Dimensional range filters ────────────────────────────────────────────────
  
  const rangeFilters = [
    ['minLengthCm', 's.length_cm >='],
    ['maxLengthCm', 's.length_cm <='],
    ['minLengthIn', 's.length_inch >='],
    ['maxLengthIn', 's.length_inch <='],
    ['minWidthCm',  's.width_cm >='],
    ['maxWidthCm',  's.width_cm <='],
    ['minWidthIn',  's.width_inch >='],
    ['maxWidthIn',  's.width_inch <='],
    ['minHeightCm', 's.height_cm >='],
    ['maxHeightCm', 's.height_cm <='],
    ['minHeightIn', 's.height_inch >='],
    ['maxHeightIn', 's.height_inch <='],
    ['minWeightG',  's.weight_g >='],
    ['maxWeightG',  's.weight_g <='],
    ['minWeightLb', 's.weight_lb >='],
    ['maxWeightLb', 's.weight_lb <='],
  ];
  
  for (const [key, sql] of rangeFilters) {
    if (normalizedFilters[key] !== undefined) {
      conditions.push(`${sql} $${paramIndexRef.value}`);
      params.push(normalizedFilters[key]);
      paramIndexRef.value++;
    }
  }
  
  // ─── Audit filters ────────────────────────────────────────────────────────────
  
  if (normalizedFilters.createdBy) {
    conditions.push(`s.created_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.createdBy);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.updatedBy) {
    conditions.push(`s.updated_by = $${paramIndexRef.value}`);
    params.push(normalizedFilters.updatedBy);
    paramIndexRef.value++;
  }
  
  // ─── Date range filters ───────────────────────────────────────────────────────
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        's.created_at',
    after:         normalizedFilters.createdAfter,
    before:        normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyDateRangeConditions({
    conditions,
    params,
    column:        's.updated_at',
    after:         normalizedFilters.updatedAfter,
    before:        normalizedFilters.updatedBefore,
    paramIndexRef,
  });
  
  // ─── Product-level filters ────────────────────────────────────────────────────
  
  if (normalizedFilters.productName) {
    conditions.push(`p.name ILIKE $${paramIndexRef.value}`);
    params.push(`%${normalizedFilters.productName}%`);
    paramIndexRef.value++;
  }
  
  // ─── Keyword (must remain last) ───────────────────────────────────────────────
  
  if (normalizedFilters.keyword) {
    conditions.push(`(
      s.sku       ILIKE $${paramIndexRef.value} OR
      p.name      ILIKE $${paramIndexRef.value} OR
      p.brand     ILIKE $${paramIndexRef.value} OR
      p.category  ILIKE $${paramIndexRef.value}
    )`);
    params.push(`%${normalizedFilters.keyword}%`);
    paramIndexRef.value++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildSkuProductCardFilters,
  buildWhereClauseAndParams,
  skuDropdownKeywordHandler,
  buildSkuFilter,
};
