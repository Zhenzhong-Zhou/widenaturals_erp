/**
 * @file customer-repository.js
 * @description Database access layer for customer records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from customer-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - insertCustomerRecords      — bulk upsert with conflict resolution
 *  - getEnrichedCustomersByIds  — bulk fetch with status and audit metadata
 *  - getPaginatedCustomers      — paginated list with filtering and sorting
 *  - getCustomerLookup          — offset-paginated lightweight dropdown lookup
 */

'use strict';

const { bulkInsert } = require('../utils/db/write-utils');
const { query } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { paginateQuery, paginateQueryByOffset } = require('../utils/db/pagination/pagination-helpers');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { buildCustomerFilter } = require('../utils/sql/build-customer-filter');
const { SORTABLE_FIELDS } = require('../utils/sort-field-mapping');
const { resolveSort } = require('../utils/query/sort-resolver');
const {
  CUSTOMER_INSERT_COLUMNS,
  CUSTOMER_UPDATE_STRATEGIES,
  CUSTOMER_CONFLICT_COLUMNS,
  CUSTOMER_ENRICHED_QUERY,
  CUSTOMER_PAGINATED_TABLE,
  CUSTOMER_PAGINATED_JOINS,
  CUSTOMER_PAGINATED_SORT_WHITELIST,
  buildCustomerPaginatedQuery,
  CUSTOMER_LOOKUP_TABLE,
  CUSTOMER_LOOKUP_SORT_WHITELIST,
  CUSTOMER_LOOKUP_ADDITIONAL_SORTS,
  buildCustomerLookupQuery,
} = require('./queries/customer-queries');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

/**
 * Bulk inserts customer records with conflict resolution on email and phone_number.
 *
 * On conflict, overwrites mutable fields (firstname, lastname, status_id, note,
 * updated_at, updated_by). Immutable fields (email, phone_number, created_by)
 * are never overwritten.
 *
 * @param {Array<Object>} customers - Validated customer objects to insert.
 * @param {PoolClient}    client    - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Inserted or upserted customer records.
 * @throws  {AppError}               Normalized database error if the insert fails.
 */
const insertCustomerRecords = async (customers, client) => {
  const context = 'customer-repository/insertCustomerRecords';
  
  const rows = customers.map((customer) => [
    customer.firstname,
    customer.lastname,
    customer.email          ?? null,
    customer.phone_number   ?? null,
    customer.status_id,
    customer.note           ?? null,
    null,                           // updated_at — null at insert time
    customer.created_by     ?? null,
    null,                           // updated_by — null at insert time
  ]);
  
  // Validation is outside the try block — a validation throw must not be
  // caught and re-thrown as a database error.
  validateBulkInsertRows(rows, CUSTOMER_INSERT_COLUMNS.length);
  
  try {
    return await bulkInsert(
      'customers',
      CUSTOMER_INSERT_COLUMNS,
      rows,
      CUSTOMER_CONFLICT_COLUMNS,
      CUSTOMER_UPDATE_STRATEGIES,
      client
    );
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Bulk insert operation failed.',
      meta:    { table: 'customers', rowCount: rows.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'customers',
        rows,
        rows.length,
        { context, conflictColumns: CUSTOMER_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ─── Enriched Bulk Fetch ──────────────────────────────────────────────────────

/**
 * Fetches enriched customer records by their IDs.
 *
 * Joins status, creator, and updater metadata for use in
 * admin views or detailed API responses.
 *
 * @param {string[]}  ids    - Customer UUIDs to fetch.
 * @param {PoolClient} client - DB client for transactional context.
 *
 * @returns {Promise<Array<Object>>} Enriched customer rows.
 * @throws  {AppError}               Normalized database error if the query fails.
 */
const getEnrichedCustomersByIds = async (ids, client) => {
  const context = 'customer-repository/getEnrichedCustomersByIds';
  
  try {
    const result = await query(CUSTOMER_ENRICHED_QUERY, [ids], client);
    return result.rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to retrieve enriched customer records.',
      meta:    { ids },
      logFn:   (err) => logDbQueryError(
        CUSTOMER_ENRICHED_QUERY,
        [ids],
        err,
        { context, ids }
      ),
    });
  }
};

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * Fetches paginated customer records with optional filtering and sorting.
 *
 * Joins status and audit user fields. Uses an EXISTS subquery for has_address
 * to avoid row multiplication from customers with multiple addresses.
 *
 * sortBy accepts sort map keys resolved via resolveSort against customerSortMap.
 * Falls back to customerSortMap.defaultNaturalSort when sortBy is unmapped.
 *
 * @param {object}       options
 * @param {object}       [options.filters={}]
 * @param {number}       [options.page=1]
 * @param {number}       [options.limit=10]
 * @param {string}       [options.sortBy='createdAt']
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC']
 * @returns {Promise<object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}       Normalized database error if the query fails.
 */
const getPaginatedCustomers = async ({
                                       filters   = {},
                                       page      = 1,
                                       limit     = 10,
                                       sortBy    = 'created_at',
                                       sortOrder = 'DESC',
                                     }) => {
  const context = 'customer-repository/getPaginatedCustomers';
  
  const { whereClause, params } = buildCustomerFilter(filters);
  
  // ORDER BY omitted — paginateQuery appends it from sortBy/sortOrder.
  const queryText = buildCustomerPaginatedQuery(whereClause);
  
  const sortConfig = resolveSort({
    sortBy,
    sortOrder,
    moduleKey:   'customerSortMap',
    defaultSort: SORTABLE_FIELDS.customerSortMap.defaultNaturalSort,
  });
  
  try {
    return await paginateQuery({
      tableName:    CUSTOMER_PAGINATED_TABLE,
      joins:        CUSTOMER_PAGINATED_JOINS,
      whereClause,
      queryText,
      params,
      page,
      limit,
      sortBy:       sortConfig.sortBy,
      sortOrder:    sortConfig.sortOrder,
      whitelistSet: CUSTOMER_PAGINATED_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch paginated customers.',
      meta:    { filters, page, limit, sortBy, sortOrder },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, page, limit }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches a lightweight customer list for dropdown/lookup use.
 *
 * Minimal projection — no audit or status join fields.
 * Includes has_address via EXISTS subquery.
 * Sorted by firstname ASC with lastname and created_at as tie-breakers.
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Optional filters.
 * @param {number} [options.limit=50]   - Max records per page.
 * @param {number} [options.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getCustomerLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'customer-repository/getCustomerLookup';
  
  const { whereClause, params } = buildCustomerFilter(filters);
  const queryText = buildCustomerLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       CUSTOMER_LOOKUP_TABLE,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'c.firstname',
      sortOrder:       'ASC',
      additionalSorts: CUSTOMER_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    CUSTOMER_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch customer lookup data.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText,
        params,
        err,
        { context, filters, limit, offset }
      ),
    });
  }
};

module.exports = {
  insertCustomerRecords,
  getEnrichedCustomersByIds,
  getPaginatedCustomers,
  getCustomerLookup,
};
