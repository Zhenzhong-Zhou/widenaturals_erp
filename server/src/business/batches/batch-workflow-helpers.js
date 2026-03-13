const {
  validateStatusTransition,
} = require('./batch-lifecycle-business');
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
 * Responsibilities:
 * - validate status transitions (unless root bypass is applied)
 * - apply lifecycle automation timestamps for specific status changes
 * - determine whether the lifecycle state changed
 *
 * No database operations occur in this function.
 *
 * @param {Object} params
 * @param {Object} params.batch - Current batch record
 * @param {string|null} params.nextStatus - Target status_id
 * @param {string|null} params.actorId - User performing the operation
 * @param {Record<string,string[]>} params.statusTransitions - Allowed lifecycle transitions
 * @param {Object} params.access - Access control object
 *
 * @returns {{
 *   lifecycleUpdates: Object,
 *   isStatusChange: boolean
 * }}
 */
const applyLifecycleTransition = ({
                                    batch,
                                    nextStatus,
                                    actorId,
                                    statusTransitions,
                                    access,
                                  }) => {
  // If no status change requested, nothing to process
  if (nextStatus == null) {
    return { lifecycleUpdates: {}, isStatusChange: false };
  }
  
  //------------------------------------------------------------
  // Validate lifecycle transition
  //------------------------------------------------------------
  if (access?.isRoot && nextStatus !== batch.status_id) {
    logSystemInfo('Root bypassing batch lifecycle transition validation', {
      batchId: batch.id,
      actorId,
      fromStatus: batch.status_name,
      toStatus: nextStatus
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
  
  const lifecycleUpdates = {};
  
  //------------------------------------------------------------
  // Lifecycle automation timestamps
  //------------------------------------------------------------
  const receivedStatusId = getStatusId('batch_received');
  const releasedStatusId = getStatusId('batch_released');
  
  if (nextStatus === receivedStatusId) {
    lifecycleUpdates.received_at = new Date();
    lifecycleUpdates.received_by = actorId;
  }
  
  if (nextStatus === releasedStatusId) {
    lifecycleUpdates.released_at = new Date();
    lifecycleUpdates.released_by = actorId;
  }
  
  return {
    lifecycleUpdates,
    isStatusChange: nextStatus !== batch.status_id
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
