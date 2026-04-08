/**
 * @file pricing-group-service.js
 * @description Service layer for pricing group retrieval.
 *
 * Orchestrates ACL evaluation, filter adjustment, repository calls,
 * and result transformation. Contains no domain logic — business rules
 * live in pricing-group-business.js.
 *
 * Exports:
 *  - fetchPaginatedPricingGroupsService — paginated pricing group list with access scoping
 *  - fetchPricingGroupByIdService       — single pricing group detail by ID
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
  getPricingGroupList,
  getPricingGroupById,
} = require('../repositories/pricing-group-repository');
const {
  evaluatePricingGroupVisibility,
  applyPricingGroupVisibilityRules,
} = require('../business/pricing-group-business');
const {
  transformPricingGroupList,
  transformPricingGroupDetail,
} = require('../transformers/pricing-group-transformer');

const CONTEXT = 'pricing-group-service';

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of pricing groups with access scoping.
 *
 * Resolves ACL, applies visibility rules, queries the repository,
 * and transforms the result for UI consumption.
 *
 * @param {Object}       options
 * @param {Object}       [options.filters={}]               - Field filters (pricingTypeId, countryCode, statusId, etc.)
 * @param {number}       [options.page=1]                   - Page number (1-based).
 * @param {number}       [options.limit=20]                 - Page size.
 * @param {string}       [options.sortBy='pricingTypeName'] - Sort key.
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']          - Sort direction.
 * @param {Object}       options.user                       - Authenticated user object.
 * @returns {Promise<PaginatedResult>}
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const fetchPaginatedPricingGroupsService = async ({
                                                    filters   = {},
                                                    page      = 1,
                                                    limit     = 20,
                                                    sortBy    = 'pricingTypeName',
                                                    sortOrder = 'ASC',
                                                    user,
                                                  }) => {
  const context = `${CONTEXT}/fetchPaginatedPricingGroupsService`;
  
  try {
    // 1. Resolve visibility access control scope.
    const acl = await evaluatePricingGroupVisibility(user);
    
    // 2. Apply visibility rules to filters (CRITICAL — must run before query).
    const adjustedFilters = applyPricingGroupVisibilityRules(filters, acl);
    
    // 3. Return empty shape immediately — no permission to view.
    if (adjustedFilters.forceEmptyResult) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 4. Query raw paginated rows.
    const rawResult = await getPricingGroupList({
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
    return transformPricingGroupList(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to retrieve pricing groups.', {
      context,
      meta: { error: error.message },
    });
  }
};

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches a single pricing group by ID.
 *
 * Throws notFoundError if no record exists for the given ID.
 *
 * @param {string} pricingGroupId - UUID of the pricing group.
 * @returns {Promise<PricingGroupDetailRecord>}
 * @throws {AppError} notFoundError if the pricing group does not exist.
 * @throws {AppError} serviceError if an unexpected error occurs.
 */
const fetchPricingGroupByIdService = async (pricingGroupId) => {
  const context = `${CONTEXT}/fetchPricingGroupByIdService`;
  
  try {
    const row = await getPricingGroupById(pricingGroupId);
    if (!row) throw AppError.notFoundError('Pricing group not found.', { context });
    return transformPricingGroupDetail(row);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.serviceError('Unable to retrieve pricing group.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedPricingGroupsService,
  fetchPricingGroupByIdService,
};
