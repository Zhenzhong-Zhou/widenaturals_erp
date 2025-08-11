const AppError = require('../utils/AppError');
const { checkRecordExists, findMissingIds } = require('../database/db');

/**
 * Validates if an ID exists in the given table.
 *
 * @param {string} table - Table name to query
 * @param {string} id - ID to validate
 * @param {object} client - Optional pg client/transaction
 * @param {string} label - Optional label for error messages (e.g., "Order Type")
 * @returns {Promise<void>}
 * @throws {AppError} - If ID is missing or not found
 */
const validateIdExists = async (table, id, client = null, label = 'Record') => {
  if (!id) {
    throw AppError.validationError(`Missing ID for ${label}`);
  }

  const exists = await checkRecordExists(table, { id }, client);
  if (!exists) {
    throw AppError.notFoundError(`${label} ID not found: ${id}`);
  }
};

/**
 * Validate that **all** IDs exist in `${schema}.${table}.${idColumn}`.
 * Performs a single batch query under the hood (via `findMissingIds`).
 *
 * Usage:
 *   await validateIdsExist(client, 'skus', skuIds, { label: 'SKU' });
 *
 * @param {import('pg').PoolClient} client
 *   PostgreSQL client/transaction (already in a tx if needed).
 * @param {string} table
 *   Table name (must be allowed/validated by your identifier safety layer).
 * @param {string[]} ids
 *   List of IDs to validate. Empty/undefined lists are treated as "nothing to validate".
 * @param {object} [opts]
 * @param {string}  [opts.label='']
 *   Human label for error messages (e.g., 'SKU', 'Price').
 * @param {string}  [opts.schema='public']
 *   Schema name. Keep default if everything lives in `public`.
 * @param {string}  [opts.idColumn='id']
 *   Primary key/ID column to check against (defaults to `"id"`).
 * @param {number}  [opts.maxShow=5]
 *   Max number of missing IDs to include in the error message preview.
 *
 * @returns {Promise<void>}
 *   Resolves if all IDs exist (or if `ids` is empty). Throws otherwise.
 *
 * @throws {AppError}
 *   `AppError.notFoundError` when one or more IDs are missing, with a concise preview list.
 */
const validateIdsExist = async (
  client,
  table,
  ids,
  { label = '', schema = 'public', idColumn = 'id', maxShow = 5 } = {}
) => {
  if (!ids || ids.length === 0) return; // nothing to validate
  
  // Single round-trip: fetch missing IDs only
  const missing = await findMissingIds(client, table, ids, { schema, idColumn });
  
  if (missing.length) {
    const preview = missing.slice(0, maxShow).join(', ');
    const suffix = missing.length > maxShow ? '…' : '';
    throw AppError.notFoundError(`${label} ID(s) not found: ${preview}${suffix}`);
  }
};

module.exports = {
  validateIdExists,
  validateIdsExist,
};
