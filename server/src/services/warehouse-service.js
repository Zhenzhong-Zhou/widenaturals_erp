/**
 * @file warehouse-service.js
 * @description Service layer for warehouse management.
 *
 * Orchestrates ACL evaluation, repository calls, and transformation.
 * No logging — globalErrorHandler owns that layer.
 *
 * Exports:
 *  - fetchPaginatedWarehousesService  — paginated warehouse list with inventory summary
 *  - fetchWarehouseDetailService      — full warehouse detail by id
 *  - fetchWarehouseLookupService      — dropdown/lookup list for warehouse selection
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  getPaginatedWarehouses,
  getWarehouseById,
} = require('../repositories/warehouse-repository');
const {
  evaluateWarehouseVisibility,
  applyWarehouseVisibilityRules,
} = require('../business/warehouse-business');
const {
  transformPaginatedWarehouseResult,
  transformWarehouseDetail,
} = require('../transformers/warehouse-transformer');

const CONTEXT = 'warehouse-service';

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches a paginated list of warehouses with inventory summary stats.
 *
 * Evaluates ACL visibility and injects server-side filter constraints
 * before querying. Returns an empty result immediately if ACL forces it.
 *
 * @param {AuthUser} user
 * @param {object}   [params={}]
 * @param {object}   [params.filters={}]
 * @param {number}   [params.page=1]
 * @param {number}   [params.limit=10]
 * @param {string}   [params.sortBy='createdAt']
 * @param {string}   [params.sortOrder='DESC']
 *
 * @returns {Promise<object>} Transformed paginated result.
 * @throws  {AppError}
 */
const fetchPaginatedWarehousesService = async (
  user,
  { filters = {}, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = {}
) => {
  const context = `${CONTEXT}/fetchPaginatedWarehousesService`;
  
  try {
    const acl = await evaluateWarehouseVisibility(user);
    const adjustedFilters = applyWarehouseVisibilityRules(filters, acl);
    
    if (adjustedFilters.forceEmptyResult) {
      return transformPaginatedWarehouseResult({ data: [], pagination: {} });
    }
    
    const result = await getPaginatedWarehouses({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    return transformPaginatedWarehouseResult(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch warehouses at this time.', {
      context,
      meta: { error: error.message },
    });
  }
};

// ─── Detail ───────────────────────────────────────────────────────────────────

/**
 * Fetches full warehouse detail by id.
 *
 * Throws a not-found error if no warehouse matches the given id.
 *
 * @param {AuthUser} user
 * @param {string}   warehouseId
 *
 * @returns {Promise<object>} Transformed warehouse detail record.
 * @throws  {AppError}
 */
const fetchWarehouseDetailService = async (user, warehouseId) => {
  const context = `${CONTEXT}/fetchWarehouseDetailService`;
  
  try {
    const row = await getWarehouseById(warehouseId);
    
    if (!row) {
      throw AppError.notFoundError('Warehouse not found.');
    }
    
    return transformWarehouseDetail(row);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch warehouse detail at this time.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedWarehousesService,
  fetchWarehouseDetailService,
};
