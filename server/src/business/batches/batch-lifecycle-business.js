const AppError = require('../../utils/AppError');
const { logSystemError } = require('../../utils/system-logger');

/**
 * Filters update payload fields based on lifecycle edit rules.
 *
 * Ensures that only fields permitted for the current batch status
 * can be updated. Any attempt to modify restricted fields will
 * trigger a validation error.
 *
 * This function does NOT mutate the original payload and returns
 * a sanitized copy of the update object.
 *
 * Example:
 * editRules = {
 *   pending: ['notes', 'status_id'],
 *   received: ['notes']
 * }
 *
 * @param {string} status - Current batch lifecycle status name
 * @param {Object<string, any>} updates - Incoming update payload
 * @param {Record<string, string[]>} editRules - Allowed fields per status
 * @returns {Object<string, any>} sanitized update payload
 *
 * @throws {AppError} If invalid fields are provided
 */
const filterEditableFields = (status, updates, editRules) => {
  // Defensive guard
  if (!updates || typeof updates !== 'object') {
    throw AppError.validationError('Invalid update payload.');
  }
  
  const allowed = editRules[status] ?? [];
  
  // Detect fields that are not allowed for this lifecycle stage
  const invalidFields = Object.keys(updates).filter(
    (field) => !allowed.includes(field)
  );
  
  if (invalidFields.length > 0) {
    throw AppError.validationError(
      'Some fields cannot be updated in the current batch state.',
      { invalidFields }
    );
  }
  
  // Return shallow copy to avoid accidental mutation
  return { ...updates };
};


/**
 * Validates whether a batch lifecycle transition is allowed.
 *
 * Ensures that the requested next status follows the defined
 * lifecycle rules. If the transition is not permitted, the
 * attempt is logged and a validation error is thrown.
 *
 * Example transitionRules:
 * {
 *   pending: ['received'],
 *   received: ['quarantined','released'],
 *   quarantined: ['released']
 * }
 *
 * @param {string} currentStatus - Current lifecycle status name
 * @param {string} nextStatus - Requested next status ID
 * @param {Record<string,string[]>} transitionRules - Allowed status transitions
 * @param {string} batchId - Batch identifier for audit logging
 * @param {string} actorId - User performing the operation
 *
 * @throws {AppError} If transition is not allowed
 */
const validateStatusTransition = (
  currentStatus,
  nextStatus,
  transitionRules,
  batchId,
  actorId
) => {
  // If no status update is requested, nothing to validate
  if (!nextStatus) return;
  
  const allowed = transitionRules[currentStatus] ?? [];
  
  // Check if requested transition is permitted
  if (!allowed.includes(nextStatus)) {
    
    // Log security/audit event
    logSystemError('Invalid batch status transition attempt', {
      context: 'batch-lifecycle/validateStatusTransition',
      batchId,
      actorId,
      currentStatus,
      nextStatus
    });
    
    throw AppError.validationError(
      `Invalid status transition: ${currentStatus} → ${nextStatus}`
    );
  }
};

module.exports = {
  filterEditableFields,
  validateStatusTransition,
};
