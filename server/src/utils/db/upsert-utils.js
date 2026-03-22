const AppError = require('../AppError');
const { q } = require('../sql-ident');
const { validateSqlIdentifiers } = require('./sql-validation');
const { buildMergeExpression } = require('./merge-utils');

/**
 * Builds a SQL update expression for UPSERT (ON CONFLICT DO UPDATE).
 *
 * Each column is updated according to a defined merge strategy.
 *
 * Strategies:
 * - add              → existing + excluded
 * - subtract         → existing - excluded
 * - max              → GREATEST(existing, excluded)
 * - min              → LEAST(existing, excluded)
 * - coalesce         → COALESCE(excluded, existing)
 * - merge_jsonb      → append JSONB audit entry
 * - merge_text       → append timestamped text
 * - keep / preserve  → skip update
 * - overwrite        → replace with EXCLUDED value
 *
 * @param {string} col
 * @param {string} strategy
 * @param {string} [tableAlias='t']
 *
 * @returns {string|null}
 * @throws {AppError}
 */
const applyUpdateRule = (col, strategy, tableAlias = 't') => {
  const context = 'upsert-utils/applyUpdateRule';
  
  validateSqlIdentifiers({ col, tableAlias, context });
  
  const c = q(col);
  const t = q(tableAlias);
  
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
      return buildMergeExpression(col, tableAlias, 'jsonb');
    
    case 'merge_text':
      return buildMergeExpression(col, tableAlias, 'text');
    
    case 'keep':
    case 'preserve':
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