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
 * Builds activity log rows for batch updates.
 *
 * Responsibilities:
 * - create lifecycle activity rows
 * - create metadata update activity rows
 *
 * No database writes occur here.
 * The caller is responsible for inserting returned rows.
 *
 * @param {Object} params
 * @param {Object} params.batch - Current batch record
 * @param {'product'|'packaging_material'} params.batchType
 * @param {string|null} params.actorId
 * @param {string|null} params.nextStatus
 * @param {boolean} params.isStatusChange
 * @param {boolean} params.hasMetadataUpdates
 * @param {Object} params.updates
 * @param {(statusId: string) => string} params.activityTypeResolver
 *
 * @returns {Array<Object>}
 * Activity rows ready for insertion.
 */
const buildBatchActivities = ({
                                batch,
                                batchType,
                                actorId,
                                nextStatus,
                                isStatusChange,
                                hasMetadataUpdates,
                                updates,
                                activityTypeResolver
                              }) => {
  const rows = [];
  
  //------------------------------------------------------------
  // No registry → no activity tracking
  //------------------------------------------------------------
  if (!batch.batch_registry_id) {
    return rows;
  }
  
  //------------------------------------------------------------
  // Lifecycle activity
  //------------------------------------------------------------
  if (isStatusChange) {
    const activityTypeId =
      activityTypeResolver(nextStatus);
    
    rows.push(
      buildBatchStatusChangeActivityRow({
        batchRegistryId: batch.batch_registry_id,
        batchType,
        activityTypeId,
        previousStatus: batch.status_name,
        nextStatus: getStatusNameById(nextStatus),
        actorId
      })
    );
  }
  
  //------------------------------------------------------------
  // Metadata update activity
  //------------------------------------------------------------
  if (hasMetadataUpdates) {
    const metadataActivityTypeId =
      getBatchActivityTypeId('BATCH_METADATA_UPDATED');
    
    rows.push(
      buildBatchMetadataUpdateActivityRow({
        batchRegistryId: batch.batch_registry_id,
        batchType,
        activityTypeId: metadataActivityTypeId,
        updates,
        actorId
      })
    );
  }
  
  return rows;
};

module.exports = {
  applyLifecycleTransition,
  prepareMetadataUpdates,
  buildBatchActivities,
};
