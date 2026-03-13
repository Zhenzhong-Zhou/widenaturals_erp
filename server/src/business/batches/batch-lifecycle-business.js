const AppError = require('../../utils/AppError');
const { logSystemError } = require('../../utils/system-logger');
// todo: adjust file name remove buisnees, regroup functions
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
  validateStatusTransition,
};
