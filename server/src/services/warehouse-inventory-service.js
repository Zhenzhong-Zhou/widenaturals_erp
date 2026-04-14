/**
 * @file warehouse-inventory-service.js
 * @description
 * Service layer for warehouse inventory retrieval.
 *
 * Orchestrates ACL evaluation, filter adjustment, paginated querying,
 * and transformer application for warehouse inventory records.
 *
 * Exports:
 *  - fetchPaginatedWarehouseInventoryService
 */

'use strict';

const { getPaginatedWarehouseInventory } = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/logging/system-logger');
const { transformPaginatedWarehouseInventory } = require('../transformers/warehouse-inventory-transformer');
const {
  evaluateWarehouseInventoryVisibility,
  applyWarehouseInventoryVisibilityRules
} = require('../business/warehouse-inventory-business');

const CONTEXT = 'warehouse-inventory-service';

/**
 * Fetches a paginated, ACL-filtered list of warehouse inventory records.
 *
 * Resolves the user's warehouse scope and batch-type visibility, applies
 * those rules to the incoming filters, queries the repository, and
 * transforms the result for UI consumption.
 *
 * @param {WarehouseInventoryFilters} filters
 * @param {number}   [page=1]
 * @param {number}   [limit=20]
 * @param {string}   [sortBy='inboundDate']
 * @param {string}   [sortOrder='DESC']
 * @param {AuthUser} user
 *
 * @returns {Promise<PaginatedResult<WarehouseInventoryRecord>>}
 * @throws {AppError} Passes through business/ACL AppErrors; wraps unexpected errors as serviceError.
 */
const fetchPaginatedWarehouseInventoryService = async ({
                                                         filters   = {},
                                                         page      = 1,
                                                         limit     = 20,
                                                         sortBy    = 'inboundDate',
                                                         sortOrder = 'DESC',
                                                         user,
                                                       }) => {
  const context = `${CONTEXT}/fetchPaginatedWarehouseInventoryService`;
  
  try {
    // 1. Resolve warehouse inventory visibility scope for this user.
    const access = await evaluateWarehouseInventoryVisibility(user);
    
    // 2. Apply warehouse scope + batch-type visibility rules to filters.
    const adjustedFilters = /** @type {WarehouseInventoryFilters} */ (
      applyWarehouseInventoryVisibilityRules(filters, access)
    );
    
    // 3. Short-circuit if user lacks access to the requested warehouse.
    if (adjustedFilters.forceEmptyResult) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 4. Query raw warehouse inventory rows.
    const rawResult = await getPaginatedWarehouseInventory({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 5. Return empty shape immediately — no records to process.
    if (!rawResult?.data?.length) {
      return { data: [], pagination: { page, limit, totalRecords: 0, totalPages: 0 } };
    }
    
    // 6. Transform for UI consumption.
    return transformPaginatedWarehouseInventory(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    logSystemException(error, 'Failed to fetch paginated warehouse inventory', {
      context,
      meta: { error: error.message },
    });
    
    throw AppError.serviceError(
      'Unable to retrieve warehouse inventory records at this time.'
    );
  }
};

module.exports = {
  fetchPaginatedWarehouseInventoryService
};
