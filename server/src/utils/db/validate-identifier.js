const AppError = require('../AppError');

/**
 * Validates a SQL identifier (table, column, schema name).
 *
 * Ensures:
 * - Proper format (PostgreSQL-safe identifier)
 * - No invalid characters
 *
 * Note:
 * - Does NOT guarantee the identifier exists in DB
 * - Should be combined with allowlist checks for full safety
 *
 * @param {string} name - Identifier to validate
 * @param {string} [type='identifier'] - Context (e.g. 'table', 'column')
 *
 * @throws {AppError} If invalid
 */
const validateIdentifier = (name, type = 'identifier') => {
  //--------------------------------------------------
  // Basic type validation
  //--------------------------------------------------
  if (typeof name !== 'string') {
    throw AppError.validationError(
      `Invalid ${type}: expected string, received ${typeof name}`
    );
  }
  
  const trimmed = name.trim();
  
  //--------------------------------------------------
  // Empty check
  //--------------------------------------------------
  if (!trimmed) {
    throw AppError.validationError(
      `Invalid ${type}: cannot be empty`
    );
  }
  
  //--------------------------------------------------
  // Format validation (PostgreSQL identifier)
  //--------------------------------------------------
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    throw AppError.validationError(
      `Invalid ${type}: "${name}"`
    );
  }
  
  return trimmed;
};

module.exports = {
  validateIdentifier,
};
