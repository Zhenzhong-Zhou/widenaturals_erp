const AppError = require('../utils/AppError');

/**
 * Adds UI-friendly derived fields to a Role lookup row.
 *
 * Adds:
 * - `isActive`: true if role.status_id === activeStatusId
 *
 * NOTE:
 * - `status_id` is the authoritative lifecycle field.
 * - `isActive` is a derived UI convenience flag only.
 * - This helper is pure and must not perform permission checks.
 *
 * @param {object} row - Raw role row from repository
 * @param {string} activeStatusId - Status ID representing an active role
 * @returns {object} Enriched role lookup row
 */
const enrichRoleOption = (row, activeStatusId) => {
  if (!row || typeof row !== 'object') {
    throw AppError.validationError(
      '[enrichRoleOption] Invalid `row`'
    );
  }
  
  if (!activeStatusId || typeof activeStatusId !== 'string') {
    throw AppError.validationError(
      '[enrichRoleOption] Invalid `activeStatusId`'
    );
  }
  
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
  };
};

module.exports = {
  enrichRoleOption,
};
