const AppError = require('../AppError');

/**
 * Validates SQL identifier inputs used in builders.
 *
 * @param {object} params
 * @param {string} params.col
 * @param {string} params.tableAlias
 * @param {string} params.context
 */
const validateSqlIdentifiers = ({ col, tableAlias, context }) => {
  if (!col || typeof col !== 'string') {
    throw AppError.validationError('Invalid column name', {
      context,
      meta: { col },
    });
  }
  
  if (!tableAlias || typeof tableAlias !== 'string') {
    throw AppError.validationError('Invalid table alias', {
      context,
      meta: { tableAlias },
    });
  }
};

module.exports = {
  validateSqlIdentifiers,
};
