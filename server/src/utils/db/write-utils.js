/**
 * @file write-utils.js
 * @module utils/db/write-utils
 * @description Database write operation utilities for bulk inserts and record updates.
 * Provides validated, error-handled helpers for mutating database records using
 * raw SQL with dynamic identifier quoting and configurable upsert behaviour.
 */

'use strict';

const AppError = require('../AppError');
const { query } = require('../../database/db');
const {
  validateIdentifier,
  assertAllowed,
  q,
  qualify,
} = require('../sql-ident');
const { maskTableName } = require('../masking/mask-primitives');
const { handleDbError } = require('../errors/error-handlers');
const { logBulkInsertError, logDbQueryError } = require('../db-logger');
const { applyUpdateRule } = require('./upsert-utils');

const CONTEXT = 'write-utils';

// ============================================================
// Bulk operations
// ============================================================

// pg hard limit is 65535 parameters per query; stay comfortably below it.
const MAX_PARAMS = 60000;

/**
 * Inserts multiple rows into a table using a bulk UPSERT pattern.
 *
 * Features:
 * - Efficient multi-row INSERT using `VALUES ($1, $2, ...), (...), ...`
 * - ON CONFLICT DO UPDATE with per-column strategy-based resolution
 * - Computed updates via `extraUpdates` for derived fields (e.g., `updated_at = NOW()`)
 * - Falls back to ON CONFLICT DO NOTHING when no update strategies are provided
 * - Retry support via the internal `query()` wrapper
 *
 * Update strategies (passed in `updateStrategies`):
 * `add`, `subtract`, `max`, `min`, `coalesce`, `merge_jsonb`, `merge_text`, `overwrite`, `keep`
 *
 * Identifier safety:
 * All table names and column names are run through `validateIdentifier` before
 * interpolation into SQL.
 *
 * Parameter limit:
 * Total parameters (`rows.length × columns.length`) must stay below `MAX_PARAMS` (60 000).
 * Split large batches into chunks at the call site.
 *
 * @param {string}                 tableName
 * @param {string[]}               columns            - Column names in the same order as row values.
 * @param {Array<Array<*>>}        rows               - Row values; each inner array must have `columns.length` elements.
 * @param {string[]}               [conflictColumns=[]]   - Columns forming the conflict target.
 * @param {Object<string,string>}  [updateStrategies={}]  - Map of column → strategy for DO UPDATE.
 * @param {import('pg').PoolClient|null} [client=null]
 * @param {object}                 [options={}]
 * @param {object}                 [options.meta={}]        - Logging metadata.
 * @param {string[]}               [options.extraUpdates=[]] - Raw SQL update fragments appended after strategy updates.
 * @param {string|null}            [returning='id']         - RETURNING clause column(s); `null` omits it.
 * @returns {Promise<object[]>} Rows returned by the RETURNING clause (empty array if none).
 * @throws {AppError} On validation failure or query error.
 */
const bulkInsert = async (
  tableName,
  columns,
  rows,
  conflictColumns = [],
  updateStrategies = {},
  client = null,
  options = {},
  returning = 'id'
) => {
  const { meta = {}, extraUpdates = [] } = options;

  if (!Array.isArray(rows) || rows.length === 0) return [];

  if (!rows.every((r) => Array.isArray(r) && r.length === columns.length)) {
    throw AppError.validationError(
      `Invalid rows: expected ${columns.length} columns`
    );
  }

  const totalParams = rows.length * columns.length;
  if (totalParams >= MAX_PARAMS) {
    throw AppError.validationError(
      'Batch too large, split into smaller chunks'
    );
  }

  // Validate extraUpdates before doing any other work so failures are caught early.
  if (!Array.isArray(extraUpdates)) {
    throw AppError.validationError('extraUpdates must be an array');
  }

  // Run all identifiers through validateIdentifier to prevent injection.
  const safeTable = validateIdentifier(tableName, 'table');
  const safeColumns = columns.map((c) => validateIdentifier(c, 'column'));
  const safeConflictColumns = conflictColumns.map((c) =>
    validateIdentifier(c, 'conflict column')
  );
  const safeUpdateColumns = Object.keys(updateStrategies).map((c) =>
    validateIdentifier(c, 'update column')
  );

  const columnNames = safeColumns.join(', ');

  const valuePlaceholders = rows
    .map(
      (_, i) =>
        `(${safeColumns
          .map((_, j) => `$${i * safeColumns.length + j + 1}`)
          .join(', ')})`
    )
    .join(', ');

  let conflictClause = '';

  if (safeConflictColumns.length > 0) {
    const tableAlias = 't';

    const updateSet = safeUpdateColumns
      .map((col) => applyUpdateRule(col, updateStrategies[col], tableAlias))
      .filter(Boolean);

    if (extraUpdates.length > 0) {
      updateSet.push(...extraUpdates);
    }

    conflictClause =
      updateSet.length > 0
        ? `ON CONFLICT (${safeConflictColumns.join(', ')}) DO UPDATE SET ${updateSet.join(', ')}`
        : `ON CONFLICT (${safeConflictColumns.join(', ')}) DO NOTHING`;
  }

  const returningClause = returning ? `RETURNING ${returning}` : '';

  const sql = `
    INSERT INTO ${safeTable} AS t (${columnNames})
    VALUES ${valuePlaceholders}
    ${conflictClause}
    ${returningClause};
  `;

  const values = rows.flat();

  try {
    const result = await query(sql, values, client, {
      retries: 3,
      baseDelay: 300,
      meta,
    });

    return result.rows;
  } catch (error) {
    const maskedTable = maskTableName(safeTable);

    throw handleDbError(error, {
      context: `${CONTEXT}/bulkInsert`,
      message: 'Bulk insert failed',
      meta: { table: maskedTable, rowCount: rows.length },
      logFn: (err) =>
        logBulkInsertError(err, maskedTable, values, rows.length, {
          columns: safeColumns,
          conflictColumns: safeConflictColumns,
          updateStrategies: safeUpdateColumns,
          extraUpdates,
          ...meta,
        }),
    });
  }
};

// ============================================================
// Single-record mutations
// ============================================================

/**
 * Updates a single record by primary key with validation, audit handling,
 * and structured error management.
 *
 * Designed for repository-layer usage with strict safety guarantees:
 * - prevents updates to protected/system fields (`id`, `created_at`, `created_by`)
 * - enforces allowed schema/table access via `assertAllowed`
 * - supports automatic audit metadata injection (`updated_by`, `updated_at`)
 * - builds fully parameterized SQL (no injection risk)
 * - optionally restricts updates to a caller-supplied `allowedFields` set
 *
 * @param {string}                   table              - Target table name.
 * @param {string}                   id                 - Primary key UUID.
 * @param {object}                   updates            - Fields to update (undefined values are stripped).
 * @param {string|null}              userId             - User performing the update (injected as `updated_by`).
 * @param {import('pg').PoolClient}  client             - Active pg client or transaction.
 * @param {object}                   [options={}]
 * @param {string}                   [options.schema='public']
 * @param {string}                   [options.updatedAtField='updated_at']
 * @param {string}                   [options.updatedByField='updated_by']
 * @param {string}                   [options.idField='id']          - Primary key column name.
 * @param {Set<string>|null}         [options.allowedFields=null]    - Optional whitelist of updatable fields.
 * @returns {Promise<{ id: string }>} The updated record's primary key.
 * @throws {AppError} ValidationError, NotFoundError, or DatabaseError.
 */
const updateById = async (
  table,
  id,
  updates = {},
  userId,
  client,
  options = {}
) => {
  const context = `${CONTEXT}/updateById`;

  const {
    schema = 'public',
    updatedAtField = 'updated_at',
    updatedByField = 'updated_by',
    idField = 'id',
    allowedFields = null,
  } = options;

  const maskedTable = maskTableName(table);

  if (!id || typeof id !== 'string' || !table || typeof table !== 'string') {
    throw AppError.validationError('Invalid update request.', { context });
  }

  if (!updates || typeof updates !== 'object') {
    throw AppError.validationError('Updates must be an object.', { context });
  }

  // Validate table/schema access before touching the payload.
  assertAllowed(schema, table);

  const PROTECTED_FIELDS = new Set(['id', 'created_at', 'created_by']);

  const updateData = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;

    if (PROTECTED_FIELDS.has(key)) {
      throw AppError.validationError('Invalid update field.', {
        context,
        field: key,
      });
    }

    if (allowedFields && !allowedFields.has(key)) {
      throw AppError.validationError('Field not allowed.', {
        context,
        field: key,
      });
    }

    acc[key] = value;
    return acc;
  }, {});

  if (userId && updatedByField) {
    updateData[updatedByField] = userId;
  }

  const fields = Object.keys(updateData);

  if (fields.length === 0) {
    throw AppError.validationError('No valid fields provided to update.', {
      context,
    });
  }

  // Build SET clause: $1 is reserved for the WHERE id = $1 condition.
  const setClauses = fields.map((field, idx) => `${q(field)} = $${idx + 2}`);

  if (updatedAtField) {
    setClauses.push(`${q(updatedAtField)} = NOW()`);
  }

  const values = [id, ...fields.map((f) => updateData[f])];

  const sql = `
    UPDATE ${qualify(schema, table)}
    SET ${setClauses.join(', ')}
    WHERE ${q(idField)} = $1
    RETURNING ${q(idField)}
  `;

  try {
    const result = await query(sql, values, client);

    if (result.rowCount === 0) {
      throw AppError.notFoundError('Record not found.', { context });
    }

    return result.rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to update ${maskedTable} record.`,
      meta: { schema, table: maskedTable, id, fields },
      logFn: (err) =>
        logDbQueryError(sql, values, err, {
          context,
          schema,
          table: maskedTable,
          id,
          fields,
        }),
    });
  }
};

module.exports = {
  bulkInsert,
  updateById,
};
