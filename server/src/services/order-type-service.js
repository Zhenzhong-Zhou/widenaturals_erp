/**
 * @file order-type-service.js
 * @description Business logic for order type retrieval.
 *
 * Exports:
 *   - fetchPaginatedOrderTypesService – paginated order types with access control and filtering
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
  getPaginatedOrderTypes,
} = require('../repositories/order-type-repository');
const {
  transformPaginatedOrderTypes,
} = require('../transformers/order-type-transformer');
const {
  enforceOrderTypeCodeAccessControl,
  filterOrderTypeRowsByPermission,
} = require('../business/order-type-business');

const CONTEXT = 'order-type-service';

/**
 * Fetches paginated order type records with access control and row-level filtering.
 *
 * Enforces code-level access control on filters and sort fields, queries the
 * repository, applies per-row permission filtering, and transforms results.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]        - Field filters to apply.
 * @param {Object}        options.user                - Authenticated user.
 * @param {number}        [options.page=1]            - Page number (1-based).
 * @param {number}        [options.limit=10]          - Records per page.
 * @param {string}        [options.sortBy='name']     - Sort field key.
 * @param {'ASC'|'DESC'}  [options.sortOrder='ASC']   - Sort direction.
 *
 * @returns {Promise<PaginatedResult<OrderTypeRow>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedOrderTypesService = async ({
  filters = {},
  user,
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'ASC',
}) => {
  const context = `${CONTEXT}/fetchPaginatedOrderTypesService`;

  try {
    // 1. Enforce code-level access control on filters and sort fields.
    await enforceOrderTypeCodeAccessControl({ user, filters, sortBy });

    // 2. Query raw paginated rows.
    const rawResult = await getPaginatedOrderTypes({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // 3. Apply per-row permission filtering.
    const filteredRows = await filterOrderTypeRowsByPermission(rawResult, user);

    // 4. Transform for UI consumption.
    return transformPaginatedOrderTypes(filteredRows);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError('Unable to fetch order type list.', {
      context,
      meta: { error: error.message },
    });
  }
};

module.exports = {
  fetchPaginatedOrderTypesService,
};
