/**
 * Product Batch Filter Builder
 *
 * Provides SQL WHERE clause construction for
 * product batch list queries at the repository layer.
 *
 * Scope:
 * - Applies only to `product_batches` operational queries
 * - Assumes required joins (skus, products, manufacturers)
 *
 * This builder:
 * - Produces SQL-safe, parameterized conditions
 * - Remains repository-only and side effect free
 *
 * Business rules, permissions, pagination, and sorting
 * are enforced upstream.
 */

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { addKeywordIlikeGroup } = require('./sql-helpers');
const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Build SQL WHERE clause and parameter list for Product Batch queries.
 *
 * Responsibilities:
 * - Construct row-level filters for PRODUCT batch LIST queries
 * - Express permission-adjusted search intent as SQL-safe conditions
 * - Remain repository-only and side effect free
 *
 * Does NOT:
 * - Interpret ACL or permissions
 * - Apply pagination or sorting
 * - Join inventory, QA, or financial data
 *
 * @param {Object} [filters={}]
 *
 * ------------------------------------------------------------------
 * Enforcement Flags (business-injected, NOT user-controlled)
 * ------------------------------------------------------------------
 *
 * @param {boolean} [filters.forceEmptyResult]
 *   When TRUE, forces the query to return zero rows (`1=0`).
 *
 * ------------------------------------------------------------------
 * Core Product Batch Filters
 * ------------------------------------------------------------------
 *
 * @param {string[]} [filters.statusIds]
 * @param {string[]} [filters.skuIds]
 * @param {string[]} [filters.productIds]
 * @param {string[]} [filters.manufacturerIds]
 *
 * ------------------------------------------------------------------
 * Lot & Date Filters
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.lotNumber]
 * @param {string} [filters.expiryAfter]
 * @param {string} [filters.expiryBefore]
 *
 * ------------------------------------------------------------------
 * Keyword Search (permission-aware)
 * ------------------------------------------------------------------
 *
 * @param {string} [filters.keyword]
 *
 * @param {Object} [filters.keywordCapabilities]
 *   Supported capabilities:
 *     - canSearchProduct        → products.name
 *     - canSearchSku            → skus.sku
 *     - canSearchManufacturer   → manufacturers.name
 *
 *   Lot number search is always allowed.
 *
 * @returns {{ whereClause: string, params: any[] }}
 */
const buildProductBatchFilter = (filters = {}) => {
  try {
    // -------------------------------------------------------------
    // Normalize date-only filters
    // -------------------------------------------------------------
    filters = normalizeDateRangeFilters(filters, 'expiryAfter', 'expiryBefore');

    const conditions = ['1=1'];
    const params = [];
    const paramIndexRef = { value: 1 };

    // -------------------------------------------------------------
    // Hard fail-closed
    // -------------------------------------------------------------
    if (filters.forceEmptyResult === true) {
      return {
        whereClause: '1=1 AND 1=0',
        params: [],
      };
    }

    // ------------------------------
    // Status
    // ------------------------------
    if (filters.statusIds?.length) {
      conditions.push(`pb.status_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.statusIds);
      paramIndexRef.value++;
    }

    // ------------------------------
    // SKU / Product / Manufacturer
    // ------------------------------
    if (filters.skuIds?.length) {
      conditions.push(`pb.sku_id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.skuIds);
      paramIndexRef.value++;
    }

    if (filters.productIds?.length) {
      conditions.push(`p.id = ANY($${paramIndexRef.value}::uuid[])`);
      params.push(filters.productIds);
      paramIndexRef.value++;
    }

    if (filters.manufacturerIds?.length) {
      conditions.push(
        `pb.manufacturer_id = ANY($${paramIndexRef.value}::uuid[])`
      );
      params.push(filters.manufacturerIds);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Lot number (ILIKE)
    // ------------------------------
    if (filters.lotNumber) {
      conditions.push(`pb.lot_number ILIKE $${paramIndexRef.value}`);
      params.push(`%${filters.lotNumber}%`);
      paramIndexRef.value++;
    }

    // ------------------------------
    // Expiry date filters (date-only, half-open)
    // ------------------------------
    applyDateRangeConditions({
      conditions,
      params,
      column: 'pb.expiry_date',
      after: filters.expiryAfter,
      before: filters.expiryBefore,
      paramIndexRef,
    });

    // ------------------------------
    // Keyword fuzzy search (permission-aware)
    // ------------------------------
    if (filters.keyword && filters.keywordCapabilities) {
      const { canSearchProduct, canSearchSku, canSearchManufacturer } =
        filters.keywordCapabilities;

      const searchableFields = [
        'pb.lot_number', // always allowed
      ];

      if (canSearchProduct) searchableFields.push('p.name');
      if (canSearchSku) searchableFields.push('sk.sku');
      if (canSearchManufacturer) searchableFields.push('m.name');

      /**
       * addKeywordIlikeGroup:
       * - Appends `(field ILIKE $n OR ...)`
       * - Pushes keyword param internally
       * - Manages placeholder index internally
       */
      addKeywordIlikeGroup(
        conditions,
        params,
        paramIndexRef.value,
        filters.keyword,
        searchableFields
      );
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build product batch filter', {
      context: 'product-batch-repository/buildProductBatchFilter',
      filters,
    });

    throw AppError.databaseError('Failed to prepare product batch filter', {
      details: err.message,
    });
  }
};

module.exports = {
  buildProductBatchFilter,
};
