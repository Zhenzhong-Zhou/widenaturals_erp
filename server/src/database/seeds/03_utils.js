/**
 * Fetch a single value dynamically from a table.
 *
 * @param {import("knex").Knex} knex - Knex instance for database queries.
 * @param {string} tableName - The table to fetch data from.
 * @param {string} columnName - The column to match the value.
 * @param {string} value - The value to match.
 * @param {string} returnColumn - The column to return.
 * @returns {Promise<any>} - The value of the return column or null if not found.
 */
const fetchDynamicValue = async (knex, tableName, columnName, value, returnColumn) => {
  // Validate arguments
  if (!tableName || !columnName || !value || !returnColumn) {
    throw new Error(
      `Invalid arguments provided to fetchDynamicValue: tableName=${tableName}, columnName=${columnName}, value=${value}, returnColumn=${returnColumn}`
    );
  }
  
  try {
    const result = await knex(tableName).select(returnColumn).where(columnName, value).first();
    
    if (!result) {
      console.warn(`No result found in table "${tableName}" where "${columnName}" = "${value}".`);
    }
    
    return result ? result[returnColumn] : null;
  } catch (error) {
    console.error(
      `Error fetching value from table "${tableName}" where "${columnName}" = "${value}":`,
      error.message
    );
    throw error;
  }
}

module.exports = { fetchDynamicValue };
