const {
  validateStatusTransition,
  filterEditableFields
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

/**
 * Applies lifecycle transition logic for a batch update.
 *
 * Responsibilities:
 * - validates status transitions
 * - applies lifecycle automation timestamps
 * - determines whether the lifecycle state changed
 *
 * No database operations occur in this function.
 *
 * @param {Object} params
 * @param {Object} params.batch - Current batch record
 * @param {string|null} params.nextStatus - Target status_id
 * @param {string|null} params.actorId - User performing the operation
 * @param {Record<string,string[]>} params.statusTransitions - Allowed lifecycle transitions
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
                                    statusTransitions
                                  }) => {
  // If no status change requested, nothing to process
  if (!nextStatus) {
    return { lifecycleUpdates: {}, isStatusChange: false };
  }
  
  //------------------------------------------------------------
  // Validate lifecycle transition
  //------------------------------------------------------------
  validateStatusTransition(
    batch.status_name,
    nextStatus,
    statusTransitions,
    batch.id,
    actorId
  );
  
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
 * Filters and prepares metadata updates for a batch record.
 *
 * Responsibilities:
 * - enforce editable fields based on lifecycle state
 * - detect whether metadata fields changed
 *
 * @param {Object} params
 * @param {Object} params.batch - Current batch record
 * @param {Object} params.updates - Incoming update payload
 * @param {Record<string,string[]>} params.editRules - Editable field rules per lifecycle state
 *
 * @returns {{
 *   safeUpdates: Object,
 *   hasMetadataUpdates: boolean
 * }}
 */
const prepareMetadataUpdates = ({
                                  batch,
                                  updates,
                                  editRules
                                }) => {
  //------------------------------------------------------------
  // Remove fields not allowed for the current lifecycle state
  //------------------------------------------------------------
  const safeUpdates = filterEditableFields(
    batch.status_name,
    updates,
    editRules
  );
  
  //------------------------------------------------------------
  // Detect metadata updates
  //------------------------------------------------------------
  const hasMetadataUpdates =
    Object.keys(safeUpdates).some(
      (k) => k !== 'status_id'
    );
  
  return {
    safeUpdates,
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
