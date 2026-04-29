/**
 * @file upsert-utils.js
 * @description
 * Utility for generating per-column SQL update expressions used in
 * ON CONFLICT DO UPDATE clauses.
 *
 * Provides `applyUpdateRule`, which maps a column + strategy pair to a
 * safe, parameterized SQL fragment. All identifiers are validated and
 * quoted before interpolation.
 *
 * Supported strategies:
 * - add        — increment: col = t.col + EXCLUDED.col
 * - subtract   — decrement: col = t.col - EXCLUDED.col
 * - max        — keep greater value via GREATEST
 * - min        — keep lesser value via LEAST
 * - coalesce   — keep existing value if EXCLUDED is null
 * - merge_jsonb — append EXCLUDED value to a JSONB audit array
 * - merge_text  — append EXCLUDED value to a newline-delimited text log
 * - overwrite  — unconditional replace: col = EXCLUDED.col
 * - keep / preserve — no-op: returns null (column is excluded from SET)
 */

'use strict';

const AppError = require('../AppError');
const { q, validateIdentifier } = require('../sql-ident');
const { buildMergeExpression } = require('./merge-utils');

/**
 * Produces a SQL SET fragment for a single column based on the given
 * conflict-resolution strategy.
 *
 * Intended for use inside `bulkInsert` when building an
 * `ON CONFLICT DO UPDATE SET` clause. The caller is responsible for
 * joining the returned fragments with `, `.
 *
 * Returns `null` for `'keep'` and `'preserve'` strategies — the caller
 * must filter null values before joining.
 *
 * All identifier inputs are validated via `validateIdentifier` and quoted
 * via `q` before interpolation. The validated values are forwarded to
 * `buildMergeExpression` for merge strategies so validation is never
 * bypassed.
 *
 * @param {string} col                  - Column name to update.
 * @param {string} strategy             - Update strategy (see file description).
 * @param {string} [tableAlias='t']     - Alias of the target table in the upsert query.
 * @returns {string|null} A SQL SET fragment, or `null` for keep/preserve.
 * @throws {AppError} On invalid identifiers or unknown strategy.
 *
 * @example
 * applyUpdateRule('quantity', 'add', 't')
 * // → '"quantity" = "t"."quantity" + EXCLUDED."quantity"'
 *
 * @example
 * applyUpdateRule('notes', 'keep', 't')
 * // → null
 */
const applyUpdateRule = (col, strategy, tableAlias = 't') => {
  const context = 'upsert-utils/applyUpdateRule';

  // Validate and normalize both identifiers up front so every branch
  // below works with safe values — including the merge delegates.
  const safeCol = validateIdentifier(col, 'column');
  const safeAlias = validateIdentifier(tableAlias, 'table alias');

  const c = q(safeCol);
  const t = q(safeAlias);

  switch (strategy) {
    case 'add':
      return `${c} = ${t}.${c} + EXCLUDED.${c}`;

    case 'subtract':
      return `${c} = ${t}.${c} - EXCLUDED.${c}`;

    case 'max':
      return `${c} = GREATEST(${t}.${c}, EXCLUDED.${c})`;

    case 'min':
      return `${c} = LEAST(${t}.${c}, EXCLUDED.${c})`;

    case 'coalesce':
      return `${c} = COALESCE(EXCLUDED.${c}, ${t}.${c})`;

    case 'merge_jsonb':
      // Pass the already-validated identifiers so buildMergeExpression
      // does not re-validate from raw input.
      return buildMergeExpression(safeCol, safeAlias, 'jsonb');

    case 'merge_text':
      return buildMergeExpression(safeCol, safeAlias, 'text');

    case 'keep':
    case 'preserve':
      // Signals to the caller that this column should be omitted from SET.
      return null;

    case 'overwrite':
      return `${c} = EXCLUDED.${c}`;

    default:
      throw AppError.validationError(`Unknown update strategy: ${strategy}`, {
        context,
        meta: { col, strategy },
      });
  }
};

module.exports = {
  applyUpdateRule,
};
