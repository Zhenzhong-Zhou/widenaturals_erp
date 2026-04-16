/**
 * @file merge-utils.js
 * @description
 * SQL expression builders for audit-style column merge strategies used in
 * ON CONFLICT DO UPDATE clauses.
 *
 * Provides `buildMergeExpression`, which generates a CASE-based SET fragment
 * that appends incoming values to an existing column rather than overwriting it.
 *
 * Supported merge types:
 * - 'jsonb' — appends the incoming value as a timestamped object into a JSONB array
 * - 'text'  — appends the incoming value as a timestamped line into a text log
 *
 * All identifiers are validated and quoted before interpolation.
 * This module has no I/O and no pg dependency.
 */

'use strict';

const { q, validateIdentifier } = require('../sql-ident');

/**
 * Builds a CASE-based SQL SET fragment that appends an incoming value to an
 * existing column, preserving the current value when the incoming one is null
 * or empty.
 *
 * Designed for use in `ON CONFLICT DO UPDATE SET` clauses where the column
 * acts as an append-only audit log rather than a simple scalar field.
 *
 * Validation is performed here even when called from `applyUpdateRule` (which
 * pre-validates) because `buildMergeExpression` is exported and may be called
 * directly by other code.
 *
 * JSONB strategy:
 * - Preserves the existing array when EXCLUDED.col IS NULL
 * - Otherwise appends `{ timestamp, data }` to the existing array,
 *   initialising it to `[]` if currently null
 *
 * TEXT strategy:
 * - Preserves the existing text when EXCLUDED.col IS NULL or blank
 * - Otherwise appends a `[YYYY-MM-DD HH24:MI:SS] <value>` line,
 *   separated from the existing content by a blank line
 *
 * @param {string} col                - Column name (validated + quoted).
 * @param {string} tableAlias         - Alias of the target table in the upsert query.
 * @param {'text'|'jsonb'} [type='text'] - Merge strategy.
 * @returns {string} A SQL SET fragment for use in an ON CONFLICT DO UPDATE clause.
 * @throws {AppError} If either identifier is invalid.
 *
 * @example
 * buildMergeExpression('audit_log', 't', 'jsonb')
 * // → '"audit_log" = CASE WHEN EXCLUDED."audit_log" IS NULL THEN ...'
 *
 * @example
 * buildMergeExpression('notes', 't', 'text')
 * // → '"notes" = CASE WHEN EXCLUDED."notes" IS NULL OR TRIM(...) ...'
 */
const buildMergeExpression = (col, tableAlias, type = 'text') => {
  const safeCol = validateIdentifier(col, 'column');
  const safeAlias = validateIdentifier(tableAlias, 'table alias');

  const c = q(safeCol);
  const t = q(safeAlias);

  // JSONB audit append: wraps the incoming value in a timestamped object
  // and concatenates it onto the existing array. COALESCE initialises a
  // null column to an empty array before appending.
  if (type === 'jsonb') {
    return `
      ${c} = CASE
        WHEN EXCLUDED.${c} IS NULL THEN ${t}.${c}
        ELSE COALESCE(${t}.${c}, '[]'::jsonb)
          || jsonb_build_array(
            jsonb_build_object(
              'timestamp', NOW(),
              'data', EXCLUDED.${c}
            )
          )
      END
    `;
  }

  // TEXT audit append: prefixes the incoming value with a timestamp and
  // joins it to the existing text with a blank line separator.
  // NULLIF(TRIM(...), '') ensures a leading blank line is not added when
  // the column is currently null or empty.
  return `
    ${c} = CASE
      WHEN EXCLUDED.${c} IS NULL OR TRIM(EXCLUDED.${c}) = '' THEN ${t}.${c}
      ELSE CONCAT_WS(
        E'\\n\\n',
        NULLIF(TRIM(${t}.${c}), ''),
        CONCAT(
          '[',
          TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS'),
          '] ',
          TRIM(EXCLUDED.${c})
        )
      )
    END
  `;
};

module.exports = {
  buildMergeExpression,
};
