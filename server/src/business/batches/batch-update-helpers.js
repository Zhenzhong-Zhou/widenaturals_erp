/**
 * @file batch-update-helpers.js
 * @description Pure domain helpers for orchestrating batch update operations.
 * Covers lifecycle transition validation, metadata normalization, previous
 * value extraction, and activity row construction.
 */

'use strict';

const { validateStatusTransition } = require('./batch-lifecycle');
const { getStatusId, getStatusNameById } = require('../../config/status-cache');
const {
  buildBatchStatusChangeActivityRow,
  buildBatchMetadataUpdateActivityRow,
} = require('./batch-activity-builder');
const {
  getBatchActivityTypeId,
} = require('../../cache/batch-activity-type-cache');
const AppError = require('../../utils/AppError');

/**
 * Applies lifecycle transition logic to a batch update operation.
 *
 * Validates the requested status transition against the allowed transition
 * map. Applies lifecycle automation hooks for statuses that require
 * system-managed field updates (e.g. `received_at`, `released_at`).
 *
 * Root users bypass transition validation — they may move a batch to any
 * status regardless of the current state.
 *
 * No-ops if `nextStatus` is null — returns empty lifecycle updates and
 * `isStatusChange: false`.
 *
 * @param {object} options
 * @param {object} options.batch - Current batch record.
 * @param {string | null} options.nextStatus - Requested next status ID, or null.
 * @param {string} options.actorId - UUID of the user requesting the update.
 * @param {Record<string, string[]>} options.statusTransitions - Permitted transition map.
 * @param {object} options.access - Resolved ACL flags for the requesting user.
 * @param {object} [options.updates={}] - Full update payload (used by lifecycle hooks).
 * @returns {{ lifecycleUpdates: object, isStatusChange: boolean }}
 */
const applyLifecycleTransition = ({
  batch,
  nextStatus,
  actorId,
  statusTransitions,
  access,
  updates,
}) => {
  if (nextStatus == null) {
    return {
      lifecycleUpdates: {},
      isStatusChange: false,
    };
  }

  if (access?.isRoot) {
    // Root users bypass transition validation — no restriction on target status.
  } else {
    validateStatusTransition(
      batch.status_name,
      nextStatus,
      statusTransitions,
      batch.id,
      actorId
    );
  }

  const lifecycleUpdates = {};

  const receivedStatusId = getStatusId('batch_received');
  const releasedStatusId = getStatusId('batch_released');

  // Lifecycle hooks automatically apply system-managed fields when a batch
  // reaches certain statuses. Caller-provided timestamps take precedence.
  const lifecycleHooks = {
    [receivedStatusId]: (u) => ({
      received_at: u?.received_at ?? new Date(),
      received_by: actorId,
    }),
    [releasedStatusId]: (u) => ({
      released_at: u?.released_at ?? new Date(),
      released_by: actorId,
    }),
  };

  if (lifecycleHooks[nextStatus]) {
    Object.assign(lifecycleUpdates, lifecycleHooks[nextStatus](updates));
  }

  return {
    lifecycleUpdates,
    isStatusChange: nextStatus !== batch.status_id,
  };
};

/**
 * Validates and normalizes a batch update payload.
 *
 * @param {object} options
 * @param {object} [options.updates={}] - Raw update payload from the caller.
 * @returns {{ safeUpdates: object, hasMetadataUpdates: boolean }}
 * @throws {AppError} validationError if the update payload is not a plain object.
 */
const prepareMetadataUpdates = ({ updates = {} }) => {
  if (typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError('Invalid batch update payload.');
  }

  return {
    safeUpdates: { ...updates },
    hasMetadataUpdates: Object.keys(updates).some((k) => k !== 'status_id'),
  };
};

/**
 * Captures the current values of fields that are about to be updated,
 * for use in activity log entries.
 *
 * Fields not present on the batch record are normalized to `null`.
 *
 * @param {object} batch - Current batch record.
 * @param {object} updates - Update payload containing the fields being changed.
 * @returns {object} Map of field names to their pre-update values.
 */
const extractPreviousValues = (batch, updates) => {
  const previous = {};

  for (const key of Object.keys(updates)) {
    previous[key] = batch[key] ?? null;
  }

  return previous;
};

/**
 * Builds batch activity log rows for a status transition and/or metadata update.
 *
 * Skips activity creation entirely if the batch has no `batch_registry_id`.
 * Only creates a metadata activity row when at least one field value has
 * actually changed compared to the current batch state.
 *
 * @param {object} options
 * @param {object} options.batch - Current batch record.
 * @param {string} options.batchType - Batch type string (e.g. `'product'`).
 * @param {string} options.actorId - UUID of the user performing the update.
 * @param {string | null} options.nextStatus - Target status ID, if a transition occurred.
 * @param {boolean} options.isStatusChange - Whether the status is changing.
 * @param {boolean} options.hasMetadataUpdates - Whether non-status fields are being updated.
 * @param {object} [options.updates] - Update payload.
 * @param {Function} options.activityTypeResolver - Function that maps a status ID to
 *   an activity type ID.
 * @returns {object[]} Array of activity row objects ready for bulk insert.
 */
const buildBatchActivities = ({
  batch,
  batchType,
  actorId,
  nextStatus,
  isStatusChange,
  hasMetadataUpdates,
  updates,
  activityTypeResolver,
}) => {
  const rows = [];

  // Activity logging requires a registry record — skip if absent.
  if (!batch.batch_registry_id) {
    return rows;
  }

  if (isStatusChange) {
    const activityTypeId = activityTypeResolver(nextStatus);

    if (activityTypeId) {
      rows.push(
        buildBatchStatusChangeActivityRow({
          batchRegistryId: batch.batch_registry_id,
          batchType,
          activityTypeId,
          previousStatus: batch.status_name,
          nextStatus: getStatusNameById(nextStatus),
          actorId,
        })
      );
    }
  }

  if (hasMetadataUpdates && updates) {
    const updateKeys = Object.keys(updates);

    if (updateKeys.length > 0) {
      const metadataActivityTypeId = getBatchActivityTypeId(
        'BATCH_METADATA_UPDATED'
      );
      const previousValues = extractPreviousValues(batch, updates);

      // Only create an activity record when at least one field value changed.
      const changedFields = updateKeys.filter(
        (key) => batch[key] !== updates[key]
      );

      if (changedFields.length > 0) {
        rows.push(
          buildBatchMetadataUpdateActivityRow({
            batchRegistryId: batch.batch_registry_id,
            batchType,
            activityTypeId: metadataActivityTypeId,
            previousValues,
            updates,
            actorId,
          })
        );
      }
    }
  }

  return rows;
};

module.exports = {
  applyLifecycleTransition,
  prepareMetadataUpdates,
  extractPreviousValues,
  buildBatchActivities,
};
