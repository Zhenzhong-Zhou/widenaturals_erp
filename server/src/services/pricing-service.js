/**
 * @file pricing-service.js
 * @description Service layer for pricing record retrieval and export.
 *
 * Orchestrates ACL evaluation, filter adjustment, repository calls,
 * and result transformation. Contains no domain logic — business rules
 * live in pricing-business.js.
 *
 * Exports:
 *  - fetchPaginatedPricingJoinService       — paginated pricing join list (scoped by group, type, SKU, or cross-group)
 *  - exportPricingRecordsService            — full export with filters
 *  - fetchPricingBySkuIdService             — all pricing groups a SKU belongs to
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  exportAllPricingRecords,
  getPaginatedPricingJoin,
  getPricingBySkuId,
} = require('../repositories/pricing-repository');
const {
  transformPricingJoinList,
  transformPricingExport,
  transformPricingBySku,
} = require('../transformers/pricing-transformer');
const {
  evaluatePricingVisibility,
  applyPricingVisibilityRules,
} = require('../business/pricing-business');

const CONTEXT = 'pricing-service';

// ─── Paginated Pricing Join List ──────────────────────────────────────────────

/**
 * Fetches a paginated pricing join list scoped by an optional fixed filter
 * (e.g. pricingGroupId, pricingTypeId, skuId) plus user-supplied filters.
 *
 * Resolves ACL, applies visibility rules, queries the repository,
 * and transforms the result for UI consumption.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]               - Field filters (includes any fixed scope filter).
 * @param {number}       [options.page=1]                   - Page number (1-based).
 * @param {number}       [options.limit=20]                 - Page size.
 * @param {string}       [options.sortBy='productName']     - Sort key.
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']          - Sort direction.
 * @param {Object}       options.user                       - Authenticated user object.
 * @returns {Promise<PaginatedResult>}
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const fetchPaginatedPricingJoinService = async ({
                                                  filters   = {},
                                                  page      = 1,
                                                  limit     = 20,
                                                  sortBy    = 'productName',
                                                  sortOrder = 'ASC',
                                                  user,
                                                }) => {
  const context = `${CONTEXT}/fetchPaginatedPricingJoinService`;
  
  try {
    // 1. Resolve visibility access control scope.
    const acl = await evaluatePricingVisibility(user);
    
    // 2. Apply visibility rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyPricingVisibilityRules(filters, acl);
    
    // 3. Return empty shape immediately — no permission to view.
    if (adjustedFilters.forceEmptyResult) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 4. Query raw paginated rows.
    const rawResult = await getPaginatedPricingJoin({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 5. Return empty shape immediately — no records to process.
    if (!rawResult || rawResult.data.length === 0) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 6. Transform for UI consumption.
    return transformPricingJoinList(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to retrieve pricing records.', {
      context,
      meta: { error: error.message },
    });
  }
};

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Exports all pricing records matching the given filters.
 *
 * Requires explicit export permission — throws authorizationError if not granted.
 * Returns an empty array if no records match.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Field filters.
 * @param {Object} options.user         - Authenticated user object.
 * @returns {Promise<Array<Object>>} Transformed export rows.
 * @throws {AppError} authorizationError if user lacks export permission.
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const exportPricingRecordsService = async ({
                                             filters = {},
                                             user,
                                           }) => {
  const context = `${CONTEXT}/exportPricingRecordsService`;
  
  try {
    // 1. Resolve visibility access control scope.
    const acl = await evaluatePricingVisibility(user);
    
    // 2. Check export permission explicitly.
    if (!acl.canExportPricing) {
      throw AppError.authorizationError(
        'You do not have permission to export pricing.', { context }
      );
    }
    
    // 3. Apply visibility rules to filters.
    const adjustedFilters = applyPricingVisibilityRules(filters, acl);
    
    // 4. Query all matching rows — no pagination.
    const rows = await exportAllPricingRecords({ filters: adjustedFilters });
    
    // 5. Return empty array immediately — no records to process.
    if (!rows || rows.length === 0) return [];
    
    // 6. Transform for export consumption.
    return transformPricingExport(rows);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to export pricing records.', {
      context,
      meta: { error: error.message },
    });
  }
};

// ─── By SKU ───────────────────────────────────────────────────────────────────

/**
 * Fetches all pricing groups a SKU belongs to.
 *
 * Returns an empty array if the SKU has no pricing assignments.
 * No ACL check — callers are expected to gate access at the controller level.
 *
 * @param {string} skuId - UUID of the SKU.
 * @returns {Promise<Array<Object>>} Transformed pricing rows.
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const fetchPricingBySkuIdService = async (skuId) => {
  const context = `${CONTEXT}/fetchPricingBySkuIdService`;
  
  try {
    const rows = await getPricingBySkuId(skuId);
    return transformPricingBySku(rows);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to retrieve pricing for SKU.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedPricingJoinService,
  exportPricingRecordsService,
  fetchPricingBySkuIdService,
};
