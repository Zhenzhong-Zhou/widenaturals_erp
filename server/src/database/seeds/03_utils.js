const AppError = require('../../utils/AppError');
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

const generateProductCode = async (knex, categoryCode) => {
  // Get the last assigned product code in this category
  const lastProduct = await knex('products')
    .where('category', categoryCode)
    .orderBy('SKU', 'desc')
    .first();

  let newCode = 101; // Default starting point

  if (lastProduct) {
    const lastCode = parseInt(lastProduct.SKU.match(/\d{3}/)[0], 10);
    newCode = lastCode + 1;
  }

  return String(newCode).padStart(3, '0'); // Ensure it's always 3 digits
};

const generateSKU = async (
  knex,
  brandCode,
  categoryCode,
  variant,
  regionCode,
  productionDate
) => {
  const productCode = await generateProductCode(knex, categoryCode);
  return `${brandCode}-${categoryCode}${productCode}-${variant}-${regionCode}-${productionDate}`;
};

module.exports = { fetchDynamicValue, fetchDynamicValues, generateSKU };
