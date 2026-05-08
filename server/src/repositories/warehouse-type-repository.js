/**
 * @file warehouse-type-repository.js
 * @description Repository functions for the warehouse_types table.
 *
 * Pattern notes:
 *  - All SQL lives in queries/warehouse-type-queries.js — never inline here.
 *  - Filter builders are imported from utils/sql/build-warehouse-type-filter.
 *  - DB errors are wrapped via handleDbError + logDbQueryError; AppErrors
 *    propagate unchanged from this layer.
 *
 * Exports:
 *  - getPaginatedWarehouseTypeLookup — paginated lookup query
 */

'use strict';

const {
  paginateQueryByOffset,
} = require('../utils/db/pagination/pagination-helpers');
const { logDbQueryError } = require('../utils/db-logger');
const { handleDbError } = require('../utils/errors/error-handlers');
const {
  buildWarehouseTypeFilters,
} = require('../utils/sql/build-warehouse-type-filter');
const {
  buildWarehouseTypeLookupQuery,
  WAREHOUSE_TYPE_LOOKUP_ADDITIONAL_SORTS,
  WAREHOUSE_TYPE_LOOKUP_JOINS,
  WAREHOUSE_TYPE_LOOKUP_SORT_WHITELIST,
  WAREHOUSE_TYPE_LOOKUP_TABLE,
} = require('./queries/warehouse-type-queries');

const CONTEXT = 'warehouse-type-repository';

/**
 * Fetches a paginated lookup of warehouse types (id, name, is_active).
 *
 * @param {WarehouseTypeFilters} [filters={}] - Filter input passed to buildWarehouseTypeFilters.
 * @param {number}               [limit=50]   - Page size.
 * @param {number}               [offset=0]   - Zero-based row offset.
 * @returns {Promise<PaginatedOffsetResult<WarehouseTypeLookupRow>>}
 */
const getPaginatedWarehouseTypeLookup = async ({
                                                 filters = {},
                                                 limit = 50,
                                                 offset = 0,
                                               }) => {
  const context = `${CONTEXT}/getPaginatedWarehouseTypeLookup`;
  const { whereClause, params } = buildWarehouseTypeFilters(filters);
  const queryText = buildWarehouseTypeLookupQuery(whereClause);
  
  try {
    return /** @type {PaginatedOffsetResult<WarehouseTypeLookupRow>} */ (
      await paginateQueryByOffset({
        tableName: WAREHOUSE_TYPE_LOOKUP_TABLE,
        joins: WAREHOUSE_TYPE_LOOKUP_JOINS,
        whereClause,
        queryText,
        params,
        offset,
        limit,
        sortBy: 'wt.name',
        sortOrder: 'ASC',
        additionalSorts: WAREHOUSE_TYPE_LOOKUP_ADDITIONAL_SORTS,
        whitelistSet: WAREHOUSE_TYPE_LOOKUP_SORT_WHITELIST,
      })
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch warehouse type lookup.',
      meta: { filters, limit, offset },
      logFn: (err) =>
        logDbQueryError(queryText, params, err, {
          context,
          filters,
          limit,
          offset,
        }),
    });
  }
};

module.exports = {
  getPaginatedWarehouseTypeLookup,
};
