const MASKING_RULES = require('./masking-rules');

/**
 * Applies domain-specific masking rules.
 *
 * @param {string} table
 * @param {Object} row
 * @returns {Object}
 */
const maskDomainRow = (table, row) => {
  if (!row || typeof row !== 'object') return row;
  
  const tableRules = MASKING_RULES[table];
  if (!tableRules) return row;
  
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      const maskFn = tableRules[key];
      
      if (typeof maskFn === 'function') {
        return [key, maskFn(value)];
      }
      
      return [key, value];
    })
  );
};

module.exports = {
  maskDomainRow,
};
