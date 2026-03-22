const AppError = require('../AppError');
const { q } = require('../sql-ident');

/**
 * Build a parameterized WHERE clause from condition objects.
 *
 * Supports:
 * - Array of objects → (a=$1 AND b=$2) OR (...)
 *
 * Design:
 * - Pure function (no DB access)
 * - Deterministic parameter order
 * - Safe for SQL parameterization
 *
 * @param {Array<object>} conditions
 * @param {number} [startIndex=1]
 *
 * @returns {{
 *   clause: string,
 *   values: any[],
 *   nextIndex: number
 * }}
 */
const buildWhereClause = (conditions, startIndex = 1) => {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw AppError.validationError('Conditions must be a non-empty array');
  }
  
  let paramIndex = startIndex;
  const values = [];
  
  const clauses = conditions.map((cond) => {
    if (!cond || typeof cond !== 'object') {
      throw AppError.validationError('Invalid condition object');
    }
    
    const keys = Object.keys(cond);
    if (keys.length === 0) {
      throw AppError.validationError('Empty condition object');
    }
    
    const parts = [];
    
    for (const key of keys) {
      parts.push(`${q(key)} = $${paramIndex++}`);
      values.push(cond[key]);
    }
    
    return `(${parts.join(' AND ')})`;
  });
  
  return {
    clause: clauses.join(' OR '),
    values,
    nextIndex: paramIndex,
  };
};

/**
 * Build IN clause for primary key lookups.
 */
const buildInClause = (column, values, startIndex = 1) => {
  if (!Array.isArray(values) || values.length === 0) {
    throw AppError.validationError('Values must be a non-empty array');
  }
  
  const placeholders = values.map((_, i) => `$${i + startIndex}`).join(', ');
  
  return {
    clause: `${q(column)} IN (${placeholders})`,
    values,
    nextIndex: startIndex + values.length,
  };
};

module.exports = {
  buildWhereClause,
  buildInClause,
};
