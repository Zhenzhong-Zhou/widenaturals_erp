const AppError = require('../../utils/AppError');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

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
const fetchDynamicValue = async (
  knex,
  tableName,
  columnName,
  value,
  returnColumn
) => {
  // Validate arguments
  if (!tableName || !columnName || !value || !returnColumn) {
    throw AppError.validationError(
      `Invalid arguments provided to fetchDynamicValue: tableName=${tableName}, columnName=${columnName}, value=${value}, returnColumn=${returnColumn}`
    );
  }

  try {
    const result = await knex(tableName)
      .select(returnColumn)
      .where(columnName, value)
      .first();

    if (!result) {
      console.warn(
        `No result found in table "${tableName}" where "${columnName}" = "${value}".`
      );
    }

    return result ? result[returnColumn] : null;
  } catch (error) {
    console.error(
      `Error fetching value from table "${tableName}" where "${columnName}" = "${value}":`,
      error.message
    );
    throw error;
  }
};

const fetchDynamicValues = async (
  knex,
  tableName,
  columnName,
  values,
  returnColumn
) => {
  if (
    !tableName ||
    !columnName ||
    !values ||
    !returnColumn ||
    !Array.isArray(values)
  ) {
    throw AppError.validationError(
      `Invalid arguments provided to fetchDynamicValues.`
    );
  }

  try {
    const results = await knex(tableName)
      .select(returnColumn, columnName)
      .whereIn(columnName, values);

    if (!results.length) {
      console.warn(
        `No results found in table "${tableName}" for values: ${values.join(', ')}`
      );
    }

    return results.reduce((acc, row) => {
      acc[row[columnName]] = row[returnColumn];
      return acc;
    }, {});
  } catch (error) {
    console.error(
      `Error fetching values from table "${tableName}" for values: ${values.join(', ')}:`,
      error.message
    );
    throw error;
  }
};

const getImageMetadata = (relativePath) => {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Avatar file not found: ${absolutePath}`);
  }
  
  const stats = fs.statSync(absolutePath);
  const mimeType = mime.lookup(absolutePath);
  
  return {
    file_size_kb: Math.ceil(stats.size / 1024),
    file_format: mime.extension(mimeType) || 'bin',
  };
};

module.exports = {
  fetchDynamicValue,
  fetchDynamicValues,
  getImageMetadata,
};
