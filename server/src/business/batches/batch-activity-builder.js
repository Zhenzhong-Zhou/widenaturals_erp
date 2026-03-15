const AppError = require('../../utils/AppError');

/**
 * Build registry rows for newly created batches.
 *
 * This function prepares records for insertion into `batch_registry`
 * corresponding to newly inserted batch rows.
 *
 * Each registry record links the created batch to a unified registry
 * entry used for lifecycle tracking and activity logging.
 *
 * @param {Object} params
 * @param {'product'|'packaging_material'} params.batchType
 * Type of batch being registered.
 *
 * @param {Array<{id:string, registryNote?:string}>} params.insertedBatches
 * Batch records returned from the batch insert operation.
 *
 * @param {string|null} params.actorId
 * User responsible for registering the batch.
 *
 * @returns {Array<Object>}
 * Registry rows ready for bulk insertion.
 */
const buildBatchRegistryRows = ({
                                  batchType,
                                  insertedBatches,
                                  actorId
                                }) => {
  // Defensive guard to prevent silent logic errors
  if (!Array.isArray(insertedBatches) || insertedBatches.length === 0) {
    return [];
  }
  
  return insertedBatches.map((batch) => {
    const row = {
      batch_type: batchType,
      product_batch_id: null,
      packaging_material_batch_id: null,
      registered_by: actorId,
      
      // Allow custom note override
      note:
        batch.registryNote ??
        'Batch registered during creation',
    };
    
    // Assign correct batch foreign key
    if (batchType === 'product') {
      row.product_batch_id = batch.id;
    }
    
    if (batchType === 'packaging_material') {
      row.packaging_material_batch_id = batch.id;
    }
    
    return row;
  });
};

/**
 * Build activity rows for batch creation events.
 *
 * This function constructs activity log entries corresponding
 * to newly inserted batch records and their associated registry entries.
 *
 * Each registry entry should correspond to the batch inserted
 * at the same index position in `insertedBatches`.
 *
 * @param {Array<{id: string}>} registry
 * @param {Array<Object>} insertedBatches
 * @param {string} batchType
 * @param {string} activityTypeId
 * @param {string} actorId
 *
 * @returns {Array<Object>} activity log rows
 */
const buildBatchActivityRows = (
  registry,
  insertedBatches,
  batchType,
  activityTypeId,
  actorId
) => {
  // Ensure registry and batch inserts are aligned
  if (registry.length !== insertedBatches.length) {
    throw AppError.validationError(
      'Batch registry and batch insert results are misaligned'
    );
  }
  
  return registry.map((r, index) => {
    const batch = insertedBatches[index];
    
    return {
      batch_registry_id: r.id,
      batch_type: batchType,
      batch_activity_type_id: activityTypeId,
      
      // Creation events have no previous value
      previous_value: null,
      
      // Store key attributes of the new batch
      new_value: {
        batch_id: batch.id,
        lot_number: batch.lot_number,
        expiry_date: batch.expiry_date,
        initial_quantity: batch.initial_quantity ?? batch.quantity,
      },
      
      change_summary: 'Batch created',
      changed_by: actorId,
    };
  });
};

/**
 * Build a batch activity log row for metadata updates.
 *
 * This helper constructs an audit log entry when batch metadata
 * (e.g., notes, expiry date, quantity, manufacturer) changes
 * without triggering a lifecycle state transition.
 *
 * The resulting object is intended to be inserted into the
 * `batch_activity_logs` table via bulk insert operations.
 *
 * @param {Object} params
 * @param {string} params.batchRegistryId
 *   Unique identifier of the batch registry record.
 *
 * @param {string} params.batchType
 *   Batch domain type (e.g. "product", "packaging_material").
 *
 * @param {string} params.activityTypeId
 *   Activity type identifier representing the metadata update event.
 *
 * @param {Object|null} [params.previousValues=null]
 *   Snapshot of previous values before the update.
 *   Only fields that are modified should be included.
 *
 * @param {Object} params.updates
 *   Object containing the updated metadata values.
 *
 * @param {string} params.actorId
 *   User ID of the actor performing the update.
 *
 * @param {string} [params.summary]
 *   Optional custom summary message for the activity log.
 *   Defaults to "Batch metadata updated".
 *
 * @returns {Object}
 * Activity log row ready for insertion.
 */
const buildBatchMetadataUpdateActivityRow = ({
                                               batchRegistryId,
                                               batchType,
                                               activityTypeId,
                                               previousValues = null,
                                               updates,
                                               actorId,
                                               summary,
                                             }) => {
  //------------------------------------------------------------
  // Validate required parameters
  //------------------------------------------------------------
  if (!batchRegistryId || !batchType || !activityTypeId) {
    throw AppError.validationError(
      'Invalid parameters for batch metadata update activity log'
    );
  }
  
  //------------------------------------------------------------
  // Construct activity row for audit logging
  //------------------------------------------------------------
  return {
    batch_registry_id: batchRegistryId,
    batch_type: batchType,
    batch_activity_type_id: activityTypeId,
    previous_value: previousValues,
    new_value: updates,
    change_summary: summary ?? 'Batch metadata updated',
    changed_by: actorId,
  };
};

/**
 * Build activity row for batch lifecycle status changes.
 *
 * Records transitions between lifecycle states such as:
 * pending → received → quarantined → released
 *
 * @param {Object} params
 * @param {string} params.batchRegistryId
 * @param {string} params.batchType
 * @param {string} params.activityTypeId
 * @param {string} params.previousStatus
 * @param {string} params.nextStatus
 * @param {string} params.actorId
 * @param {string} [params.summary]
 *
 * @returns {Object} activity log row
 */
const buildBatchStatusChangeActivityRow = ({
                                             batchRegistryId,
                                             batchType,
                                             activityTypeId,
                                             previousStatus,
                                             nextStatus,
                                             actorId,
                                             summary,
                                           }) => {
  // Ensure required fields exist
  if (!batchRegistryId || !batchType || !activityTypeId) {
    throw AppError.validationError(
      'Invalid parameters for batch status change activity log'
    );
  }
  
  return {
    batch_registry_id: batchRegistryId,
    batch_type: batchType,
    batch_activity_type_id: activityTypeId,
    
    // Record lifecycle transition
    previous_value: { status: previousStatus },
    new_value: { status: nextStatus },
    
    change_summary:
      summary ??
      `Batch status changed: ${previousStatus} → ${nextStatus}`,
    
    changed_by: actorId,
  };
};

module.exports = {
  buildBatchRegistryRows,
  buildBatchActivityRows,
  buildBatchMetadataUpdateActivityRow,
  buildBatchStatusChangeActivityRow,
};
