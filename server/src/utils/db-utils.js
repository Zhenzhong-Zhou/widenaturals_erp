/**
 * Generates a dynamic SQL COUNT query.
 *
 * @param {string} tableName - The name of the main table.
 * @param {Array<string>} joins - Array of JOIN clauses.
 * @param {string} whereClause - The WHERE clause for filtering.
 * @returns {string} - The dynamically generated COUNT SQL query.
 */
const generateCountQuery = (tableName, joins = [], whereClause = '1=1') => {
  const joinClause = joins.join(' '); // Combine all JOIN clauses
  return `
    SELECT COUNT(*) AS total
    FROM ${tableName}
    ${joinClause}
    WHERE ${whereClause}
  `;
};

module.exports = {
  generateCountQuery,
};
