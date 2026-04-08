/**
 * @file lock-modes.js
 * @module utils/db/lock-modes
 * @description PostgreSQL row-level lock mode constants and row locking utilities.
 * Provides validated, transaction-scoped helpers for acquiring row-level locks
 * using allowlisted PostgreSQL lock modes.
 *
 * Reference: https://www.postgresql.org/docs/current/explicit-locking.html
 */

'use strict';

const AppError = require('../AppError');
const { query } = require('../../database/db');
const { q, qualify } = require('../sql-ident');
const { maskTableName, maskUUID } = require('../masking/mask-primitives');
const { handleDbError } = require('../errors/error-handlers');
const { logLockRowError, logLockRowsError } = require('../db-logger');
const { logSystemWarn } = require('../logging/system-logger');
const { buildInClause, buildWhereClause } = require('./where-builder');

/**
 * Canonical SQL strings for each PostgreSQL row-level lock mode.
 *
 * Use these named constants when constructing SELECT ... FOR <mode> queries
 * instead of inline strings — ensures consistency and catches typos at
 * reference time rather than at query execution.
 *
 * Frozen to prevent accidental mutation of the source-of-truth values.
 *
 * @enum {string}
 * @readonly
 */
const LOCK_MODES = Object.freeze({
  UPDATE:        'FOR UPDATE',
  NO_KEY_UPDATE: 'FOR NO KEY UPDATE',
  SHARE:         'FOR SHARE',
  KEY_SHARE:     'FOR KEY SHARE',
});

const CONTEXT = 'lock-modes';

/**
 * Set of all valid lock mode SQL strings, derived from `LOCK_MODES`.
 *
 * Use for O(1) validation of caller-supplied lock mode strings.
 * Derived once at module load — callers should import this rather than
 * constructing their own Set from `LOCK_MODES` values.
 *
 * @type {Set<string>}
 */
const LOCK_MODE_SET = new Set(Object.values(LOCK_MODES));


// ============================================================
// Row locking
// ============================================================

/**
 * Locks a single row by primary key within an active transaction.
 *
 * Executes `SELECT * FROM <table> WHERE id = $1 <lockMode>` to acquire
 * a row-level lock. The caller is responsible for surrounding this call
 * with `withTransaction`.
 *
 * Design notes:
 * - Assumes a standardized primary key column named `id`
 * - Uses `qualify` and `q` for safe identifier quoting
 * - Guarantees exactly one row or throws `NotFoundError`
 *
 * @param {import('pg').PoolClient} client   - Active transaction client.
 * @param {string}                  table    - Table name (validated upstream).
 * @param {string}                  id       - Primary key UUID value.
 * @param {string}                  [lockMode='FOR UPDATE'] - PostgreSQL lock mode (validated against allowlist).
 * @param {object}                  [meta={}]              - Additional logging metadata.
 * @returns {Promise<object>} The locked row.
 * @throws {AppError} On invalid input, row not found, or query failure.
 */
const lockRow = async (
  client,
  table,
  id,
  lockMode = 'FOR UPDATE',
  meta = {}
) => {
  const context = `${CONTEXT}/lockRow`;
  const maskedId = maskUUID(id);
  const maskedTable = maskTableName(table);
  
  if (!id || typeof id !== 'string') {
    throw AppError.validationError('Invalid id', { context });
  }
  
  if (!LOCK_MODE_SET.has(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`, { context });
  }
  
  const sql = `
    SELECT *
    FROM ${qualify('public', table)}
    WHERE ${q('id')} = $1
    ${lockMode}
  `;
  
  try {
    const { rows } = await query(sql, [id], client);
    
    if (!rows.length) {
      throw AppError.notFoundError(
        `Row "${maskedId}" not found in "${maskedTable}"`
      );
    }
    
    return rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to lock row in "${maskedTable}"`,
      meta: { table: maskedTable, id: maskedId, ...meta },
      logFn: (err) =>
        logLockRowError(err, sql, [id], maskedTable, lockMode, meta),
    });
  }
};

/**
 * Locks multiple rows within an active transaction.
 *
 * Supports two condition shapes:
 * - **Primitive array** (e.g., `['id-1', 'id-2']`): generates `WHERE id IN (...)`.
 *   Index-optimized; logs a warning on partial match.
 * - **Object array** (e.g., `[{ tenant_id: 'x', sku: 'y' }]`): generates composite
 *   `WHERE (a=$1 AND b=$2) OR (...)`. Degrades with size — batch at > 50 rows.
 *
 * Must be called inside a transaction. Uses `qualify` / `q` for safe identifier quoting.
 *
 * @param {import('pg').PoolClient} client        - Active transaction client.
 * @param {string}                  table         - Table name.
 * @param {Array<string|object>}    conditions    - IDs (primitives) or condition objects.
 * @param {string}                  [lockMode='FOR UPDATE'] - PostgreSQL lock mode.
 * @param {object}                  [meta={}]               - Additional logging metadata.
 * @returns {Promise<object[]>} Locked rows.
 * @throws {AppError} On invalid input or query failure.
 */
const lockRows = async (
  client,
  table,
  conditions,
  lockMode = 'FOR UPDATE',
  meta = {}
) => {
  const context = `${CONTEXT}/lockRows`;
  const maskedTable = maskTableName(table);
  
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw AppError.validationError('Invalid conditions', { context });
  }
  
  if (!LOCK_MODE_SET.has(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`, { context });
  }
  
  // Determine condition shape: primitives → IN clause; objects → composite WHERE.
  const isPrimitiveList =
    typeof conditions[0] !== 'object' || conditions[0] === null;
  
  const sanitizedConditions = conditions.filter(
    (v) => v !== null && v !== undefined
  );
  
  if (sanitizedConditions.length === 0) {
    throw AppError.validationError('Empty conditions after sanitization', { context });
  }
  
  const { clause, values } = isPrimitiveList
    ? buildInClause('id', sanitizedConditions)
    : buildWhereClause(sanitizedConditions);
  
  const sql = `
    SELECT *
    FROM ${qualify('public', table)}
    WHERE ${clause}
    ${lockMode}
  `;
  
  try {
    const { rows } = await query(sql, values, client);
    
    // Warn when fewer rows were locked than requested — indicates missing records.
    if (isPrimitiveList && rows.length !== sanitizedConditions.length) {
      logSystemWarn('Partial row lock result', {
        context: `${context}/partial`,
        expected: sanitizedConditions.length,
        found: rows.length,
        table: maskedTable,
      });
    }
    
    // Composite OR conditions degrade with size — alert early.
    if (!isPrimitiveList && conditions.length > 50) {
      logSystemWarn('Potential slow composite lock query', {
        context: `${context}/performance`,
        count: conditions.length,
        table: maskedTable,
      });
    }
    
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to lock rows in "${maskedTable}"`,
      meta: { table: maskedTable, count: conditions.length, ...meta },
      logFn: (err) =>
        logLockRowsError(err, sql, values, maskedTable, meta),
    });
  }
};

module.exports = {
  LOCK_MODES,
  LOCK_MODE_SET,
  lockRow,
  lockRows,
};
