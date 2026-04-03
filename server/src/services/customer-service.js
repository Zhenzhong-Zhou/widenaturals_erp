/**
 * @file customer-service.js
 * @description Business logic for customer creation and retrieval.
 *
 * Exports:
 *   - createCustomersService              – bulk-inserts customers with preparation and filtering
 *   - fetchPaginatedCustomersService      – paginated customer retrieval with access control
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers (repository, validators, business) are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const MAX_LIMITS                         = require('../utils/constants/general/max-limits');
const { validateBulkInputSize }          = require('../utils/validation/bulk-input-validator');
const AppError                           = require('../utils/AppError');
const {
  insertCustomerRecords,
  getEnrichedCustomersByIds,
  getPaginatedCustomers,
}                                        = require('../repositories/customer-repository');
const { withTransaction }                = require('../database/db');
const {
  transformEnrichedCustomers,
  transformPaginatedCustomerResults,
}                                        = require('../transformers/customer-transformer');
const {
  prepareCustomersForInsert,
  filterCustomerForViewer,
  evaluateCustomerLookupAccessControl,
  enforceCustomerLookupVisibilityRules,
}                                        = require('../business/customer-business');
const { getStatusId }                    = require('../config/status-cache');

/**
 * Creates one or more customer records with preparation, bulk insert, and permission filtering.
 *
 * Validates input size, prepares customer data, inserts atomically, retrieves enriched records,
 * and applies permission-based field filtering before returning.
 *
 * @param {Array<Object>} customers            - Customer objects to insert.
 * @param {Object}        user                 - Authenticated user (requires `id` and `role`).
 * @param {string}        [purpose='insert_response'] - Response shape purpose:
 *                                               `'insert_response'` | `'detail_view'` | `'admin_view'`
 *
 * @returns {Promise<Array<Object>>} Transformed and permission-filtered customer records.
 *
 * @throws {AppError} Re-throws AppErrors from validators/repository/business unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const createCustomersService = async (
  customers,
  user,
  purpose = 'insert_response'
) => {
  const createdBy = user.id;
  
  return withTransaction(async (client) => {
    try {
      validateBulkInputSize(
        customers,
        MAX_LIMITS.BULK_INPUT_LIMITS.MAX_UI_INSERT_SIZE,
        'customers'
      );
      
      const preparedCustomers = await prepareCustomersForInsert(customers, createdBy);
      const inserted          = await insertCustomerRecords(preparedCustomers, client);
      
      if (!Array.isArray(inserted) || inserted.length === 0) {
        throw AppError.databaseError('No customer records were inserted.');
      }
      
      const insertedIds     = inserted.map((row) => row.id);
      const rawResult       = await getEnrichedCustomersByIds(insertedIds, client);
      const enrichedRecords = transformEnrichedCustomers(rawResult);
      
      // filterCustomerForViewer is async — run concurrently, not sequentially.
      return Promise.all(
        enrichedRecords.map((customer) =>
          filterCustomerForViewer(customer, user, purpose)
        )
      );
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      throw AppError.serviceError('Unable to create customer records.', {
        meta: { error: error.message },
      });
    }
  });
};

/**
 * Fetches paginated customer records scoped to the requesting user's access level.
 *
 * Evaluates user access control, applies visibility rules to filters, queries the
 * repository, and transforms results for UI consumption.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {Object}        options.user                   - Authenticated user (requires `id` and `role`).
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<PaginatedResult<Object>>} Transformed customer records and pagination metadata.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedCustomersService = async ({
                                                filters   = {},
                                                user,
                                                page      = 1,
                                                limit     = 10,
                                                sortBy    = 'createdAt',
                                                sortOrder = 'DESC',
                                              }) => {
  try {
    // 1. Evaluate user access control scope.
    const userAccess = await evaluateCustomerLookupAccessControl(user);
    
    // 2. Apply visibility rules — restricts filters based on access level.
    const activeStatusId   = getStatusId('customer_active');
    const adjustedFilters  = enforceCustomerLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );
    
    // 3. Fetch paginated records with adjusted filters.
    const rawResult = await getPaginatedCustomers({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // 4. Transform for UI consumption.
    return transformPaginatedCustomerResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch customer list.', {
      meta: { error: error.message },
    });
  }
};

module.exports = {
  createCustomersService,
  fetchPaginatedCustomersService,
};
