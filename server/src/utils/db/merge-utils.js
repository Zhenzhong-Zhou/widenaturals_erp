const AppError = require('../AppError');
const { q } = require('../sql-ident');
const { validateSqlIdentifiers } = require('./sql-validation');

/**
 * Builds a SQL merge expression for audit-style columns.
 *
 * Supports:
 * - JSONB → append structured audit entries (array of objects)
 * - TEXT  → append timestamped log entries
 *
 * Behavior:
 * - Skips update if EXCLUDED value is NULL (or empty for text)
 * - Preserves existing data
 * - Ensures consistent audit trail format
 *
 * JSONB structure:
 * [
 *   { "timestamp": "...", "data": ... }
 * ]
 *
 * @param {string} col
 * @param {string} tableAlias
 * @param {'jsonb'|'text'} [type='text']
 *
 * @returns {string}
 * @throws {AppError}
 */
const buildMergeExpression = (col, tableAlias, type = 'text') => {
  const context = 'merge-utils/buildMergeExpression';
  
  validateSqlIdentifiers({ col, tableAlias, context });
  
  const c = q(col);
  const t = q(tableAlias);
  
  //--------------------------------------------------
  // JSONB audit append
  //--------------------------------------------------
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
  
  //--------------------------------------------------
  // TEXT audit append
  //--------------------------------------------------
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
