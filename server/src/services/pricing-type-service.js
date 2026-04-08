/**
 * @file pricing-type-service.js
 * @description Service layer for pricing type retrieval.
 *
 * Orchestrates ACL evaluation, filter adjustment, repository calls,
 * and result transformation. Contains no domain logic — business rules
 * live in pricing-type-business.js.
 *
 * Exports:
 *  - fetchPaginatedPricingTypesService — paginated pricing type list with access scoping
 *  - fetchPricingTypeByIdService       — single pricing type detail by ID
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
  getPricingTypeList,
  getPricingTypeById,
} = require('../repositories/pricing-type-repository');
const {
  evaluatePricingTypeVisibility,
  applyPricingTypeVisibilityRules,
} = require('../business/pricing-type-business');
const {
  transformPricingTypeList,
  transformPricingTypeRow,
} = require('../transformers/pricing-type-transformer');

const CONTEXT = 'pricing-type-service';

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of pricing types with access scoping.
 *
 * Resolves ACL, applies visibility rules, queries the repository,
 * and transforms the result for UI consumption.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]             - Field filters.
 * @param {number}       [options.page=1]                 - Page number (1-based).
 * @param {number}       [options.limit=10]               - Page size.
 * @param {string}       [options.sortBy='pricingTypeName'] - Sort key.
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']        - Sort direction.
 * @param {Object}       options.user                     - Authenticated user object.
 * @returns {Promise<PaginatedResult>}
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const fetchPaginatedPricingTypesService = async ({
                                                   filters   = {},
                                                   page      = 1,
                                                   limit     = 10,
                                                   sortBy    = 'pricingTypeName',
                                                   sortOrder = 'ASC',
                                                   user,
                                                 }) => {
  const context = `${CONTEXT}/fetchPaginatedPricingTypesService`;
  
  try {
    // 1. Resolve visibility access control scope.
    const acl = await evaluatePricingTypeVisibility(user);
    
    // 2. Apply visibility rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyPricingTypeVisibilityRules(filters, acl);
    
    // 3. Return empty shape immediately — no permission to view.
    if (adjustedFilters.forceEmptyResult) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 4. Query raw paginated rows.
    const rawResult = await getPricingTypeList({
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
    return transformPricingTypeList(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to retrieve pricing types.', {
      context,
      meta: { error: error.message },
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single pricing type by ID.
 *
 * Throws notFoundError if no record exists for the given ID.
 *
 * @param {string} pricingTypeId - UUID of the pricing type.
 * @returns {Promise<PricingTypeFlatRecord>}
 * @throws {AppError} notFoundError if the pricing type does not exist.
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const fetchPricingTypeByIdService = async (pricingTypeId) => {
  const context = `${CONTEXT}/fetchPricingTypeByIdService`;
  
  try {
    const row = await getPricingTypeById(pricingTypeId);
    if (!row) throw AppError.notFoundError('Pricing type not found.', { context });
    return transformPricingTypeRow(row);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to retrieve pricing type.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedPricingTypesService,
  fetchPricingTypeByIdService,
};
