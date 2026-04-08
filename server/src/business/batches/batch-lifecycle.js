/**
 * @file batch-lifecycle.js
 * @description Pure domain validator for batch status transition rules.
 */

'use strict';

const AppError = require('../../utils/AppError');
const { logSystemWarn } = require('../../utils/logging/system-logger');

const CONTEXT = 'batch-lifecycle';

/**
 * Validates that a requested batch status transition is permitted by the
 * transition rule map for the current status.
 *
 * A warn-level audit log is emitted on invalid transition attempts —
 * these are security-relevant events worth tracking even though the error
 * is handled by the caller.
 *
 * No-ops if `nextStatus` is absent — no transition requested.
 *
 * @param {string} currentStatus - The batch's current status name.
 * @param {string | undefined} nextStatus - The requested next status name.
 * @param {Record<string, string[]>} transitionRules - Map of current status
 *   to array of permitted next statuses.
 * @param {string} batchId - UUID of the batch being transitioned (for audit).
 * @param {string} actorId - UUID of the user requesting the transition (for audit).
 * @returns {void}
 * @throws {AppError} validationError if the transition is not permitted.
 */
const validateStatusTransition = (
  currentStatus,
  nextStatus,
  transitionRules,
  batchId,
  actorId
) => {
  if (!nextStatus) return;
  
  const allowed = transitionRules[currentStatus] ?? [];
  
  if (!allowed.includes(nextStatus)) {
    // logSystemWarn used here — invalid transition attempts are security-relevant
    // audit events worth tracking independently of the validation error thrown.
    logSystemWarn('Invalid batch status transition attempt', {
      context: `${CONTEXT}/validateStatusTransition`,
      batchId,
      actorId,
      currentStatus,
      nextStatus,
    });
    
    throw AppError.validationError(
      `Invalid status transition: ${currentStatus} → ${nextStatus}`
    );
  }
};

module.exports = {
  validateStatusTransition,
};
