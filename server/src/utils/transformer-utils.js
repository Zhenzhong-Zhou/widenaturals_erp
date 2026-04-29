/**
 * @file transformer-utils.js
 * @description Generic transformation utilities for row-level and paginated results.
 *
 * Exports:
 *   - transformRows                – applies a sync transformer to an array of rows
 *   - transformRowsAsync           – applies an async transformer to an array of rows
 *   - transformPageResult          – transforms a paginated repository result (page-based)
 *   - transformLoadMoreResult      – transforms a paginated repository result (offset/load-more)
 *   - transformIdNameToIdLabel     – converts `{ id, name }` to `{ id, label }` for dropdowns
 *   - includeFlagsBasedOnAccess    – selectively exposes row flags based on a caller-supplied flag map
 *
 * Note: `deriveInventoryStatusFlags` lives in `inventory-utils.js` —
 * it derives computed domain flags and does not belong in a generic transformer utility.
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject } = require('./object-utils');

// ---------------------------------------------------------------------------
// Row transformers
// ---------------------------------------------------------------------------

/**
 * Applies a synchronous transformer to an array of rows.
 *
 * Returns an empty array if the input is not a valid array.
 *
 * @template T, U
 * @param {T[]}           rows        - Raw rows to transform.
 * @param {(row: T) => U} transformer - Sync function applied to each row.
 * @returns {U[]}
 */
const transformRows = (rows, transformer) => {
  if (!Array.isArray(rows)) return [];
  return rows.map(transformer);
};

/**
 * Applies an async transformer to an array of rows concurrently.
 *
 * Uses `Promise.all` for concurrent execution. Returns an empty array
 * if the input is not a valid array.
 *
 * @template T, U
 * @param {T[]}                                       rows        - Raw rows to transform.
 * @param {(row: T, index: number) => U | Promise<U>} transformer - Async or sync transformer.
 * @returns {Promise<U[]>}
 */
const transformRowsAsync = async (rows, transformer) => {
  if (!Array.isArray(rows)) return [];
  return Promise.all(rows.map(transformer));
};

// ---------------------------------------------------------------------------
// Paginated transformer (page-based)
// ---------------------------------------------------------------------------

/**
 * Transforms a paginated repository result by applying a row transformer
 * to each record while preserving pagination metadata.
 *
 * Filters out null/undefined rows returned by the transformer.
 * Returns a safe empty structure if the input is malformed.
 *
 * @template T
 * @param {PaginatedQueryResult<T>}                        paginatedResult
 * @param {(row: T) => unknown | Promise<unknown>}         transformFn
 * @returns {Promise<PaginatedResult<T>>}
 */
const transformPageResult = async (paginatedResult, transformFn) => {
  if (!paginatedResult || !Array.isArray(paginatedResult.data)) {
    return {
      data: [],
      pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 0 },
    };
  }

  const { data = [], pagination = {} } = paginatedResult;

  const transformedItems = (await transformRowsAsync(data, transformFn)).filter(
    Boolean
  );

  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? 10);
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const totalPages = pagination.totalPages ?? Math.ceil(totalRecords / limit);

  return {
    data: transformedItems,
    pagination: { page, limit, totalRecords, totalPages },
  };
};

// ---------------------------------------------------------------------------
// Load-more transformer (offset-based)
// ---------------------------------------------------------------------------

/**
 * Transforms a paginated repository result into a load-more compatible response.
 *
 * Applies the transformer to each row, filters nulls, and computes `hasMore`
 * from offset and total record count.
 * Returns a safe empty structure if the input is malformed.
 *
 * @template TInput, TOutput
 * @param {PaginatedQueryResult<TInput>}                        paginatedResult
 * @param {(row: TInput) => TOutput | Promise<TOutput>}         transformFn
 * @returns {Promise<LoadMoreResult<TOutput>>}
 */
const transformLoadMoreResult = async (paginatedResult, transformFn) => {
  if (!paginatedResult || !Array.isArray(paginatedResult.data)) {
    return { items: [], offset: 0, limit: 10, hasMore: false };
  }

  const { data = [], pagination = {} } = paginatedResult;

  const transformedItems = (await transformRowsAsync(data, transformFn)).filter(
    Boolean
  );

  const page = Number(pagination.page ?? 1);
  const limit = Number(pagination.limit ?? 10);
  const totalRecords = Number(pagination.totalRecords ?? 0);
  const offset = pagination.offset ?? (page - 1) * limit;

  return {
    items: transformedItems,
    offset,
    limit,
    hasMore: offset + transformedItems.length < totalRecords,
  };
};

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Converts a `{ id, name }` row into the `{ id, label }` dropdown shape.
 *
 * Null/undefined values are pruned via `cleanObject`.
 * Callers are responsible for passing a valid `{ id, name }` object.
 *
 * @param {{ id: string, name: string }} row
 * @returns {{ id: string, label: string }}
 */
const transformIdNameToIdLabel = (row) =>
  cleanObject({
    id: row.id,
    label: row.name,
  });

/**
 * Selectively includes row flags in lookup output based on a caller-supplied flag map.
 *
 * The `flagMap` maps ACL key names to row property names. When the ACL key is
 * truthy on `userAccess`, the corresponding row property is included in the result.
 *
 * This design keeps `includeFlagsBasedOnAccess` open for extension — adding a new
 * ACL flag never requires modifying this function. Each caller declares its own map.
 *
 * Special cases with conditional nested logic (e.g. `isNormal`/`issueReasons` for SKUs)
 * should be handled inline in the caller after this function returns.
 *
 * @param {Object}  row               - Enriched lookup row with derived flags.
 * @param {Object}  [userAccess={}]   - Access control context.
 * @param {FlagMap} [flagMap={}]      - Maps ACL keys to row property names.
 * @returns {Object} Filtered subset of flags safe to expose to this user.
 *
 * @example
 * includeFlagsBasedOnAccess(row, userAccess, {
 *   canViewAllStatuses:     'isActive',
 *   canViewAllValidLookups: 'isValidToday',
 *   canViewArchived:        'isArchived',
 * })
 */
const includeFlagsBasedOnAccess = (row, userAccess = {}, flagMap = {}) => {
  if (!row) return {};

  const result = {};

  for (const [aclKey, rowKey] of Object.entries(flagMap)) {
    if (userAccess[aclKey]) {
      result[rowKey] = row[rowKey] ?? false;
    }
  }

  return cleanObject(result);
};

// ---------------------------------------------------------------------------

module.exports = {
  transformRows,
  transformRowsAsync,
  transformPageResult,
  transformLoadMoreResult,
  transformIdNameToIdLabel,
  includeFlagsBasedOnAccess,
};
