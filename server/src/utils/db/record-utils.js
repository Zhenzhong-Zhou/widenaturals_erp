/**
 * @file record-utils.js
 * @module utils/db/record-utils
 * @description Scalar and field lookup utilities for querying individual records
 * and validating row existence against the database. All identifiers are quoted
 * and validated to prevent SQL injection.
 */

'use strict';

const AppError = require('../AppError');
const { query } = require('../../database/db');
const { validateIdentifier, q, qualify } = require('../sql-ident');
const { maskTableName } = require('../masking/mask-primitives');
const { handleDbError } = require('../errors/error-handlers');
const { logDbQueryError } = require('../db-logger');
const { logSystemException } = require('../logging/system-logger');
const { uniq } = require('../array-utils');

const CONTEXT = 'record-utils';

// ============================================================
// Scalar / field lookup utilities
// ============================================================

/**
 * Retrieves a single scalar value from a table matching a WHERE condition.
 *
 * Supports one or more key-value pairs in `where` — all are combined with
 * AND. Uses `LIMIT 2` internally to detect unexpected duplicate rows; throws
 * a `DatabaseError` if more than one row matches. Returns `null` when no
 * matching row is found.
 *
 * Null values in `where` are converted to `IS NULL` conditions.
 * All identifiers are quoted via `q`/`qualify` to prevent SQL injection.
 *
 * @param {object}                  params
 * @param {string}                  params.table  - Table name.
 * @param {object}                  params.where  - One or more key-value WHERE conditions.
 * @param {string}                  params.select - Column whose value is returned.
 * @param {import('pg').PoolClient} [client]      - Optional transaction client.
 * @param {object}                  [meta={}]     - Logging metadata.
 * @returns {Promise<*|null>} The scalar value, or `null` if not found.
 * @throws {AppError} On invalid input, duplicate row, or query failure.
 *
 * @example
 * const email = await getUniqueScalarValue(
 *   { table: 'users', where: { id: userId }, select: 'email' }
 * );
 *
 * @example
 * const addressId = await getUniqueScalarValue(
 *   { table: 'addresses', where: { full_name: 'John Doe', label: 'Shipping' }, select: 'id' }
 * );
 */
const getUniqueScalarValue = async (
  { table, where, select },
  client,
  meta = {}
) => {
  const context = `${CONTEXT}/getUniqueScalarValue`;
  
  if (!table || typeof where !== 'object' || !select) {
    throw AppError.validationError(
      'Invalid parameters for getUniqueScalarValue.'
    );
  }
  
  const maskedTable = maskTableName(table);
  const whereKeys = Object.keys(where ?? {});
  
  if (whereKeys.length === 0) {
    throw AppError.validationError(
      'getUniqueScalarValue: where condition must have at least one key.'
    );
  }
  
  // Build multi-condition WHERE clause with correct $N indices.
  let paramIdx = 1;
  const whereParts = [];
  const whereValues = [];
  
  for (const key of whereKeys) {
    const val = where[key];
    if (val === null) {
      whereParts.push(`${q(key)} IS NULL`);
    } else {
      whereParts.push(`${q(key)} = $${paramIdx++}`);
      whereValues.push(val);
    }
  }
  
  const sql = `
    SELECT ${q(select)}
    FROM ${qualify('public', table)}
    WHERE ${whereParts.join(' AND ')}
    LIMIT 2
  `;
  
  try {
    const result = await query(sql, whereValues, client);
    
    if (result.rows.length === 0) return null;
    
    if (result.rows.length > 1) {
      throw AppError.databaseError(
        `Multiple rows found in "${maskedTable}" for ${whereKeys.join(', ')}`
      );
    }
    
    return result.rows[0][select];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to fetch value '${select}' from '${maskedTable}'.`,
      meta: { table: maskedTable, select, where: Object.fromEntries(whereKeys.map(k => [k, where[k]])), ...meta },
      logFn: (err) =>
        logDbQueryError(sql, whereValues, err, {
          context,
          table: maskedTable,
          select,
          ...meta,
        }),
    });
  }
};

/**
 * Checks whether a record matching `condition` exists in `table`.
 *
 * Supports `null` values in the condition by converting them to `IS NULL`
 * in the WHERE clause.
 *
 * Uses `validateIdentifier` for the table name and quotes each condition
 * key via `q()` to prevent SQL injection on column names.
 *
 * @param {string}                   table      - Table name.
 * @param {object}                   condition  - Key-value WHERE condition; null values → IS NULL.
 * @param {import('pg').PoolClient}  [client=null]
 * @returns {Promise<boolean>} `true` if a matching record exists.
 * @throws {AppError} On invalid input or query failure.
 *
 * @example
 * // Standard value condition
 * await checkRecordExists('orders', { id: orderId });
 *
 * // Null condition (IS NULL)
 * await checkRecordExists('addresses', { customer_id: null });
 */
const checkRecordExists = async (table, condition, client = null) => {
  // Use validateIdentifier for consistency with the rest of the module.
  const safeTable = validateIdentifier(table, 'table');
  
  const keys = Object.keys(condition ?? {});
  if (keys.length === 0) {
    throw AppError.validationError('No condition provided for checkRecordExists');
  }
  
  // Build a stable, ordered list of [key, value] pairs so that the
  // $N parameter indices align correctly with the values array.
  let paramIdx = 1;
  const whereParts = [];
  const values = [];
  
  for (const key of keys) {
    const val = condition[key];
    if (val === null) {
      // Null values use IS NULL — no parameter placeholder needed.
      whereParts.push(`${q(key)} IS NULL`);
    } else {
      whereParts.push(`${q(key)} = $${paramIdx++}`);
      values.push(val);
    }
  }
  
  const sql = `SELECT EXISTS (SELECT 1 FROM ${safeTable} WHERE ${whereParts.join(' AND ')}) AS exists`;
  
  try {
    const { rows } = await query(sql, values, client);
    return rows[0]?.exists === true;
  } catch (error) {
    const context = `${CONTEXT}/checkRecordExists`;
    
    const maskedTable = maskTableName(table);
    
    throw handleDbError(error, {
      context,
      message: `Failed to check existence in "${maskedTable}"`,
      meta: { table: maskedTable },
      logFn: (err) =>
        logSystemException(err, 'Failed to check record existence', {
          context,
          table: maskedTable,
        }),
    });
  }
};

/**
 * Returns IDs from `ids` that are NOT present in `<schema>.<table>.<idColumn>`.
 *
 * Uses a single `UNNEST`-based query (one round-trip) to avoid N+1 lookups.
 * Deduplicates `ids` before querying via `uniq`.
 *
 * @param {import('pg').PoolClient} client
 * @param {string}                  table
 * @param {string[]}                ids
 * @param {object}                  [opts={}]
 * @param {string}                  [opts.schema='public']
 * @param {string}                  [opts.idColumn='id']
 * @param {boolean}                 [opts.logOnError=true]
 * @returns {Promise<string[]>} IDs from the input list that have no matching row.
 * @throws {AppError} On query failure.
 */
const findMissingIds = async (client, table, ids, opts = {}) => {
  const context = `${CONTEXT}/findMissingIds`;
  
  const {
    schema = 'public',
    idColumn = 'id',
    logOnError = true,
  } = opts;
  
  const list = uniq(ids);
  if (list.length === 0) return [];
  
  const maskedTable = maskTableName(table);
  
  const sql = `
    WITH input(id) AS (
      SELECT DISTINCT UNNEST($1::uuid[])
    )
    SELECT i.id
    FROM input i
    WHERE NOT EXISTS (
      SELECT 1
      FROM ${qualify(schema, table)} t
      WHERE t.${q(idColumn)} = i.id
    );
  `;
  
  try {
    const { rows } = await query(sql, [list], client);
    return rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to validate IDs',
      meta: {
        table: `${schema}.${maskedTable}`,
        idColumn,
        count: list.length,
      },
      logFn: logOnError
        ? (err) =>
          logSystemException(err, 'Batch ID existence check failed', {
            context,
            table: `${schema}.${maskedTable}`,
            idColumn,
            count: list.length,
          })
        : undefined,
    });
  }
};

/**
 * Fetches one or more columns from a table row by its primary key.
 *
 * Returns the full row object (e.g., `{ name: '...', category: '...' }`).
 * Returns `null` if no row matches. Throws `DatabaseError` on duplicate
 * primary key (data integrity violation).
 *
 * Column names are sanitized via `validateIdentifier`. Table name is
 * quoted via `qualify`.
 *
 * @param {string}                   table                   - Table name.
 * @param {string}                   id                      - Primary key UUID.
 * @param {string|string[]}          [selectFields=['name']] - Column(s) to retrieve.
 * @param {import('pg').PoolClient}  [client=null]
 * @returns {Promise<object|null>} Row object with the requested fields, or `null`.
 * @throws {AppError} On invalid input or query failure.
 *
 * @example
 * const row = await getFieldsById('order_types', typeId, ['name', 'category']);
 * // { name: 'Standard', category: 'sales' }
 */
const getFieldsById = async (
  table,
  id,
  selectFields = ['name'],
  client = null
) => {
  const context = `${CONTEXT}/getFieldsById`;
  
  if (!table || typeof table !== 'string' || !id) {
    throw AppError.validationError('Invalid parameters for getFieldsById');
  }
  
  const maskedTable = maskTableName(table);
  
  // Use validateIdentifier for consistency — rejects unsafe names with a
  // structured error rather than silently stripping characters.
  const safeFields = (Array.isArray(selectFields) ? selectFields : [selectFields])
    .map((field) => validateIdentifier(field, 'select field'));
  
  const sql = `
    SELECT ${safeFields.map((f) => q(f)).join(', ')}
    FROM ${qualify('public', table)}
    WHERE ${q('id')} = $1
    LIMIT 2
  `;
  
  try {
    const result = await query(sql, [id], client);
    
    if (result.rows.length === 0) return null;
    
    if (result.rows.length > 1) {
      throw AppError.databaseError(
        `Duplicate id in table '${maskedTable}'`
      );
    }
    
    return result.rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to fetch fields from '${maskedTable}'`,
      meta: { table: maskedTable, selectFields: safeFields },
      logFn: (err) =>
        logSystemException(err, 'Failed to fetch fields by ID', {
          context,
          table: maskedTable,
          selectFields: safeFields,
        }),
    });
  }
};

/**
 * Returns an array of values from `selectField` in `table`, filtered
 * by a single `whereKey = whereValue` condition.
 *
 * Useful for simple lookups such as:
 * - all `id`s where `category = 'sales'`
 * - all `code`s where `is_active = true`
 *
 * All identifiers are run through `validateIdentifier` and quoted via `q`/`qualify`.
 * Validation throws are separated from the IO try/catch to prevent double-logging.
 *
 * @param {string}                   table
 * @param {string}                   whereKey     - Column to filter by.
 * @param {*}                        whereValue   - Value to filter against.
 * @param {string}                   [selectField='id'] - Column whose values are returned.
 * @param {import('pg').PoolClient}  [client=null]
 * @returns {Promise<*[]>} Array of values from `selectField`.
 * @throws {AppError} On invalid input or query failure.
 *
 * @example
 * const ids = await getFieldValuesByField('order_types', 'category', 'sales');
 * // ['type-1', 'type-2']
 *
 * @example
 * const codes = await getFieldValuesByField('discounts', 'is_active', true, 'code');
 * // ['SUMMER10', 'FREESHIP']
 */
const getFieldValuesByField = async (
  table,
  whereKey,
  whereValue,
  selectField = 'id',
  client = null
) => {
  const context = `${CONTEXT}/getFieldValuesByField`;
  
  // Validate before entering the IO try/catch so a ValidationError thrown
  // here is NOT caught below and therefore not double-logged.
  if (!table || !whereKey || !selectField) {
    throw AppError.validationError(
      'Invalid parameters for getFieldValuesByField'
    );
  }
  
  const safeTable    = validateIdentifier(table, 'table');
  const safeField    = validateIdentifier(selectField, 'select field');
  const safeWhereKey = validateIdentifier(whereKey, 'where key');
  
  const sql = `
    SELECT ${q(safeField)}
    FROM ${qualify('public', safeTable)}
    WHERE ${q(safeWhereKey)} = $1
  `;
  
  try {
    const result = await query(sql, [whereValue], client);
    return result.rows.map((row) => row[safeField]);
  } catch (error) {
    const maskedTable = maskTableName(table);
    
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch field values',
      meta: { table: maskedTable, whereKey, selectField },
      logFn: (err) =>
        logSystemException(err, 'Failed to get field values by field', {
          context,
          table: maskedTable,
          whereKey,
          selectField,
        }),
    });
  }
};

module.exports = {
  getUniqueScalarValue,
  checkRecordExists,
  findMissingIds,
  getFieldsById,
  getFieldValuesByField,
};
