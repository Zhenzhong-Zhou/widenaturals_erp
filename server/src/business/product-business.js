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

/**
 * Business Rule: Filter and Validate Updatable Product Fields
 *
 * Ensures only safe, business-allowed fields can be updated in product info
 * operations. Blocks modification of status or system-managed metadata fields.
 *
 * ### Behavior
 * - Accepts a raw update payload (usually from service layer).
 * - Rejects forbidden fields like `status_id` or audit columns.
 * - Returns a sanitized object containing only whitelisted fields.
 *
 * @param {Object} updates - Raw update payload (partial product data).
 * @returns {Object} Filtered update object ready for persistence.
 *
 * @throws {AppError.validationError}
 *   - If payload is invalid or empty.
 *   - If forbidden fields are included.
 */
const filterUpdatableProductFields = (updates = {}) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError('Invalid product update payload.');
  }
  
  // Explicitly allowed fields for editable product info
  const allowedFields = ['name', 'series', 'brand', 'category', 'description', 'updated_by', 'updated_at'];
  
  // Fields that must never be changed through this flow
  const forbiddenFields = ['status_id', 'status', 'created_by', 'created_at'];
  
  // Quick check for forbidden keys (fast path)
  for (const key of Object.keys(updates)) {
    if (forbiddenFields.includes(key)) {
      throw AppError.validationError(
        `Field "${key}" cannot be modified through this operation. ` +
        'Use the appropriate workflow (e.g., status update service).'
      );
    }
  }
  
  // Extract only allowed keys
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );
  
  if (Object.keys(filtered).length === 0) {
    throw AppError.validationError(
      'No valid editable product fields provided for update.'
    );
  }
  
  return filtered;
};

module.exports = {
  validateProductStatusTransition,
  assertValidProductStatusTransition,
  filterUpdatableProductFields,
};
