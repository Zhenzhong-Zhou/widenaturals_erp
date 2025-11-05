const { getStatusNameById } = require('../config/status-cache');
const AppError = require('../utils/AppError');

/**
 * Validates whether a product can transition from its current status
 * to a new target status, based on allowed transitions.
 *
 * ### Behavior
 * - Uses uppercase normalization for status names from cache.
 * - Returns `false` if either status ID is missing or unknown.
 *
 * ### Example
 * ```
 * validateProductStatusTransition('uuid-active', 'uuid-archived'); // true
 * validateProductStatusTransition('uuid-archived', 'uuid-active'); // false
 * ```
 *
 * @param {string} currentStatusId - UUID of the current product status
 * @param {string} newStatusId - UUID of the target product status
 * @returns {boolean} True if the transition is allowed, false otherwise
 */
const validateProductStatusTransition = (currentStatusId, newStatusId) => {
  const allowedTransitions = {
    PENDING: ['ACTIVE', 'INACTIVE'],
    ACTIVE: ['INACTIVE', 'DISCONTINUED', 'ARCHIVED'],
    INACTIVE: ['ACTIVE'],
    DISCONTINUED: ['ARCHIVED'],
    ARCHIVED: [],
  };
  
  const currentCode = getStatusNameById(currentStatusId);
  const nextCode = getStatusNameById(newStatusId);
  
  if (!currentCode || !nextCode) return false;
  
  const allowedNextStates = allowedTransitions[currentCode] ?? [];
  return allowedNextStates.includes(nextCode);
};

/**
 * Asserts that a product’s status transition is valid according to
 * business-defined transition rules.
 *
 * This function builds upon {@link validateProductStatusTransition},
 * but instead of returning `false`, it **throws** an AppError if the
 * transition is not permitted.
 *
 * ### Behavior
 * - Looks up both statuses from the in-memory cache.
 * - Throws if either status ID is unknown.
 * - Throws if the transition violates defined transition rules.
 *
 * ### Example
 * ```
 * assertValidProductStatusTransition(currentStatusId, nextStatusId);
 * // continues silently if allowed
 * // throws AppError.validationError if invalid
 * ```
 *
 * @param {string} currentStatusId - UUID of the current product status
 * @param {string} newStatusId - UUID of the target product status
 * @throws {AppError} If the transition is invalid or unknown
 */
const assertValidProductStatusTransition = (currentStatusId, newStatusId) => {
  const current = getStatusNameById(currentStatusId);
  const next = getStatusNameById(newStatusId);
  
  if (!current || !next) {
    throw AppError.validationError('Unknown status ID(s).', {
      currentStatusId,
      newStatusId,
    });
  }
  
  if (!validateProductStatusTransition(currentStatusId, newStatusId)) {
    throw AppError.validationError(`Invalid transition: ${current} → ${next}`);
  }
};

module.exports = {
  validateProductStatusTransition,
  assertValidProductStatusTransition,
};
