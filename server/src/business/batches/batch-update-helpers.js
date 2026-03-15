const {
  validateStatusTransition,
} = require('./batch-lifecycle');
const {
  getStatusId,
  getStatusNameById
} = require('../../config/status-cache');
const {
  buildBatchStatusChangeActivityRow,
  buildBatchMetadataUpdateActivityRow
} = require('./batch-activity-builder');
const { getBatchActivityTypeId } = require('../../cache/batch-activity-type-cache');
const { logSystemInfo } = require('../../utils/system-logger');
const AppError = require('../../utils/AppError');

/**
 * Applies lifecycle transition logic for a batch update.
 *
 * This function performs three responsibilities:
 *
 * 1. Validates whether the requested lifecycle transition is allowed.
 * 2. Applies lifecycle automation fields (timestamps and actor IDs)
 *    when specific statuses are reached.
 * 3. Determines whether the lifecycle status actually changed.
 *
 * The function does **not perform any database operations**. It only
 * returns the lifecycle-related update fields that should be merged
 * into the final update payload by the caller.
 *
 * Root users may bypass lifecycle validation checks, but lifecycle
 * automation hooks still apply.
 *
 * Example lifecycle automation:
 *
 * - `batch_received` → sets `received_at` and `received_by`
 * - `batch_released` → sets `released_at` and `released_by`
 *
 * @param {Object} params
 *
 * @param {Object} params.batch
 * Current batch record containing lifecycle information.
 *
 * @param {string|null} params.nextStatus
 * Target lifecycle status **ID** requested by the update.
 *
 * @param {string|null} params.actorId
 * Identifier of the user performing the operation.
 *
 * @param {Record<string,string[]>} params.statusTransitions
 * Map describing allowed lifecycle transitions.
 *
 * Example:
 * {
 *   pending: ['received'],
 *   received: ['quarantined','released']
 * }
 *
 * @param {Object} params.access
 * Access control result for the current user.
 *
 * @param {Object} [params.updates]
 * Partial update payload provided by the caller.
 * Used to allow explicit timestamps such as `received_at`
 * or `released_at` when provided.
 *
 * @returns {{
 *   lifecycleUpdates: {
 *     received_at?: Date,
 *     received_by?: string,
 *     released_at?: Date,
 *     released_by?: string
 *   },
 *   isStatusChange: boolean
 * }}
 *
 * `lifecycleUpdates`
 * Fields automatically applied by lifecycle rules.
 *
 * `isStatusChange`
 * Indicates whether the lifecycle status actually changed.
 */
const applyLifecycleTransition = ({
                                    batch,
                                    nextStatus,
                                    actorId,
                                    statusTransitions,
                                    access,
                                    updates,
                                  }) => {
  //------------------------------------------------------------
  // If no lifecycle status change is requested, exit early
  //------------------------------------------------------------
  if (nextStatus == null) {
    return {
      lifecycleUpdates: {},
      isStatusChange: false,
    };
  }
  
  //------------------------------------------------------------
  // Validate lifecycle transition
  //------------------------------------------------------------
  if (access?.isRoot && nextStatus !== batch.status_id) {
    // Root users bypass transition validation but the action is logged
    logSystemInfo('Root bypassing batch lifecycle transition validation', {
      batchId: batch.id,
      actorId,
      fromStatus: batch.status_name,
      toStatus: nextStatus,
    });
  } else {
    validateStatusTransition(
      batch.status_name,
      nextStatus,
      statusTransitions,
      batch.id,
      actorId
    );
  }
  
  //------------------------------------------------------------
  // Lifecycle automation hooks
  //------------------------------------------------------------
  const lifecycleUpdates = {};
  
  const receivedStatusId = getStatusId('batch_received');
  const releasedStatusId = getStatusId('batch_released');
  
  /**
   * Lifecycle hooks automatically apply system-managed
   * fields when a batch reaches certain statuses.
   */
  const lifecycleHooks = {
    [receivedStatusId]: (updates) => ({
      // Allow caller-provided timestamp, otherwise use system time
      received_at: updates?.received_at ?? new Date(),
      received_by: actorId,
    }),
    
    [releasedStatusId]: (updates) => ({
      // Allow caller-provided timestamp, otherwise use system time
      released_at: updates?.released_at ?? new Date(),
      released_by: actorId,
    }),
  };
  
  //------------------------------------------------------------
  // Apply lifecycle automation if a hook exists
  //------------------------------------------------------------
  if (lifecycleHooks[nextStatus]) {
    Object.assign(
      lifecycleUpdates,
      lifecycleHooks[nextStatus](updates)
    );
  }
  
  //------------------------------------------------------------
  // Return lifecycle updates and status-change indicator
  //------------------------------------------------------------
  return {
    lifecycleUpdates,
    isStatusChange: nextStatus !== batch.status_id,
  };
};

/**
 * Normalizes and inspects an incoming batch update payload.
 *
 * Responsibilities:
 * - validate update payload structure
 * - detect whether metadata fields (non-status fields) changed
 * - return a safe shallow copy of the updates object
 *
 * Note:
 * Lifecycle edit rules and permission validation are enforced
 * later by `filterUpdatableBatchFields`.
 *
 * @param {Object} params
 * @param {Object} params.updates - Incoming update payload
 *
 * @returns {{
 *   safeUpdates: Object,
 *   hasMetadataUpdates: boolean
 * }}
 */
const prepareMetadataUpdates = ({ updates = {} }) => {
  //------------------------------------------------------------
  // Validate update payload structure
  //------------------------------------------------------------
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError(
      'Invalid batch update payload.'
    );
  }
  
  //------------------------------------------------------------
  // Detect metadata updates
  //------------------------------------------------------------
  const hasMetadataUpdates = Object.keys(updates).some(
    (k) => k !== 'status_id'
  );
  
  //------------------------------------------------------------
  // Return normalized update payload
  //------------------------------------------------------------
  return {
    safeUpdates: { ...updates },
    hasMetadataUpdates
  };
};

/**
 * Extract previous values for fields being updated on a batch.
 *
 * This helper builds a snapshot of the original values for each field
 * present in the update payload. It is used to record before/after
 * differences in batch activity logs.
 *
 * Only fields included in the `updates` object are inspected.
 *
 * @param {Object} batch
 * Current batch record loaded from the database.
 *
 * @param {Object} updates
 * Update payload containing fields that will be modified.
 *
 * @returns {Object}
 * Object containing the previous values for each updated field.
 */
const extractPreviousValues = (batch, updates) => {
  //------------------------------------------------------------
  // Create a clean object without prototype inheritance
  //------------------------------------------------------------
  const previous = Object.create(null);
  
  //------------------------------------------------------------
  // Capture original values for fields being updated
  //------------------------------------------------------------
  for (const key of Object.keys(updates)) {
    // If the field does not exist on the batch record,
    // normalize the value to null for consistent logging
    previous[key] = batch[key] ?? null;
  }
  
  return previous;
};

/**
 * Builds activity log rows representing lifecycle and metadata
 * changes applied to a batch.
 *
 * This helper is intentionally pure and performs no database writes.
 * It only constructs activity log payloads which the caller may
 * later persist.
 *
 * Generated activities may include:
 *  - lifecycle status transitions
 *  - metadata updates (e.g. quantity, expiry date, notes)
 *
 * Metadata activity is recorded only when at least one field value
 * actually differs from the current batch state.
 *
 * @param {Object} params
 * @param {Object} params.batch
 * Current batch record containing at minimum:
 * - batch_registry_id
 * - status_name
 *
 * @param {'product'|'packaging_material'} params.batchType
 * Domain type of the batch.
 *
 * @param {string|null} params.actorId
 * User responsible for performing the update.
 *
 * @param {string|null} params.nextStatus
 * Target lifecycle status ID if a transition occurs.
 *
 * @param {boolean} params.isStatusChange
 * Indicates whether the lifecycle status changed.
 *
 * @param {boolean} params.hasMetadataUpdates
 * Indicates whether metadata updates were attempted or permitted.
 *
 * @param {Object} params.updates
 * Final update payload representing metadata values that will be
 * written to the database.
 *
 * @param {(statusId: string) => string|null} params.activityTypeResolver
 * Function mapping a status ID to its corresponding batch
 * activity type ID.
 *
 * @returns {Array<Object>}
 * Activity rows ready for insertion into the batch activity log.
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
  
  //------------------------------------------------------------
  // Activity logging requires a registry record
  //------------------------------------------------------------
  if (!batch.batch_registry_id) {
    return rows;
  }
  
  //------------------------------------------------------------
  // Lifecycle activity (status transition)
  //------------------------------------------------------------
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
  
  //------------------------------------------------------------
  // Metadata update activity
  //------------------------------------------------------------
  if (hasMetadataUpdates && updates) {
    const updateKeys = Object.keys(updates);
    
    if (updateKeys.length > 0) {
      const metadataActivityTypeId =
        getBatchActivityTypeId('BATCH_METADATA_UPDATED');
      
      // Extract previous values only for fields being updated
      const previousValues = extractPreviousValues(batch, updates);
      
      // Detect actual field changes compared to current batch state
      const changedFields = updateKeys.filter(
        key => batch[key] !== updates[key]
      );
      
      // Only create an activity record when a real change occurred
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
  buildBatchActivities,
};
