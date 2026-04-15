/**
 * @file inventory-activity-log-service.js
 * @description
 * Service layer for inventory activity log retrieval.
 *
 * Orchestrates warehouse scope enforcement, paginated querying,
 * and transformer application for inventory activity log records.
 *
 * Exports:
 *  - fetchPaginatedActivityLogService
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  assertWarehouseAccess,
  enforceWarehouseScope,
} = require('../business/warehouse-inventory-business');
const { getPaginatedInventoryActivityLog } = require('../repositories/inventory-activity-log-repository');
const { transformPaginatedInventoryActivityLog } = require('../transformers/inventory-activity-log-transformer');

const CONTEXT = 'inventory-activity-log-service';

/**
 * Fetches a paginated activity log scoped to a given warehouse,
 * enforcing warehouse access before querying.
 *
 * @param {object}   filters
 * @param {string}   filters.warehouseId
 * @param {string}   [filters.inventoryId]
 * @param {string}   [filters.actionTypeId]
 * @param {string}   [filters.performedBy]
 * @param {string}   [filters.dateAfter]
 * @param {string}   [filters.dateBefore]
 * @param {number}   [page=1]
 * @param {number}   [limit=20]
 * @param {string}   [sortBy='performedAt']
 * @param {string}   [sortOrder='DESC']
 * @param {AuthUser} user
 * @returns {Promise<PaginatedResult<InventoryActivityLogRecord>>}
 * @throws {AppError} Passes through ACL AppErrors; wraps unexpected errors as serviceError.
 */
const fetchPaginatedActivityLogService = async ({
                                                  filters   = {},
                                                  page      = 1,
                                                  limit     = 20,
                                                  sortBy    = 'performedAt',
                                                  sortOrder = 'DESC',
                                                  user,
                                                }) => {
  const context = `${CONTEXT}/fetchPaginatedActivityLogService`
  
  try {
    const assignedWarehouseIds = await assertWarehouseAccess(user);
    enforceWarehouseScope(assignedWarehouseIds, filters.warehouseId);
    
    const rawResult = await getPaginatedInventoryActivityLog({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    if (!rawResult || rawResult.data.length === 0) {
      return {
        data:       [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }
    
    return transformPaginatedInventoryActivityLog(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
   
    throw AppError.serviceError(
      'Unable to retrieve inventory activity log at this time.',
      {
        context,
        meta: { error: error.message }
      }
    );
  }
};

module.exports = {
  fetchPaginatedActivityLogService,
};
