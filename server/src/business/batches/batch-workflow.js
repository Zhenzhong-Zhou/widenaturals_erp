const { insertBatchRegistryBulk } = require('../../repositories/batch-registry-repository');
const { insertBatchActivityLogsBulk } = require('../../repositories/batch-activity-log-repository');
const AppError = require('../../utils/AppError');
const {
  buildBatchRegistryRows,
  buildBatchActivityRows,
} = require('./batch-activity-builder');
const {
  prepareMetadataUpdates,
  applyLifecycleTransition,
  buildBatchActivities
} = require('./batch-workflow-helpers');

/**
 * Register newly created batches and record activity logs.
 *
 * This workflow ensures that batch creation, registry entry creation,
 * and activity logging occur within the same database transaction.
 *
 * Steps:
 * 1. Insert batch records.
 * 2. Register batches in `batch_registry`.
 * 3. Record creation activity logs.
 *
 * Supports multiple batch types (product, packaging_material).
 *
 * @param {Object} params
 * @param {'product'|'packaging_material'} params.batchType - Type of batch being created
 * @param {Array<Object>} params.batches - Batch records to insert
 * @param {(batches: Object[], client: any) => Promise<Object[]>} params.insertBatchFn - Repository insert function
 * @param {string} params.batchCreatedActivityTypeId - Activity type ID for batch creation
 * @param {string|null} params.actorId - User performing the operation
 * @param {import('pg').PoolClient} params.client - Transaction client
 *
 * @returns {Promise<Array<Object>>} Inserted batch records
 */
const registerBatchWorkflow = async ({
                                       batchType,
                                       batches,
                                       insertBatchFn,
                                       batchCreatedActivityTypeId,
                                       actorId,
                                       client,
                                     }) => {
  if (!Array.isArray(batches) || batches.length === 0) {
    throw AppError.validationError('No batches provided for registration.');
  }
  
  // -------------------------------------------------------------
  // Step 1: Insert batch records
  // -------------------------------------------------------------
  const insertedBatches = await insertBatchFn(batches, client);
  
  if (!insertedBatches?.length) {
    throw AppError.databaseError('Failed to insert batch records.');
  }
  
  // -------------------------------------------------------------
  // Step 2: Register batches in batch_registry
  // -------------------------------------------------------------
  const registryRows = buildBatchRegistryRows({
    batchType,
    insertedBatches,
    actorId
  });
  
  const registry = await insertBatchRegistryBulk(registryRows, client);
  
  if (registry.length !== insertedBatches.length) {
    throw AppError.databaseError('Batch registry creation mismatch.');
  }
  
  // -------------------------------------------------------------
  // Step 3: Record batch creation activity logs
  // -------------------------------------------------------------
  const activityRows = buildBatchActivityRows(
    registry,
    insertedBatches,
    batchType,
    batchCreatedActivityTypeId,
    actorId
  );
  
  await insertBatchActivityLogsBulk(activityRows, client);
  
  return insertedBatches;
};

/**
 * Generic batch update workflow used for lifecycle and metadata updates.
 *
 * Responsibilities:
 * - validates lifecycle status transitions
 * - enforces editable fields per lifecycle state
 * - applies lifecycle automation (received_at / released_at timestamps)
 * - updates the batch record via repository
 * - generates lifecycle and metadata activity logs
 *
 * This workflow is shared across batch domains
 * such as product batches and packaging material batches.
 *
 * @param {Object} params
 *
 * @param {string} params.batchId
 * Unique batch identifier.
 *
 * @param {Object} params.updates
 * Partial batch fields to update.
 *
 * @param {string|null} params.actorId
 * User performing the operation.
 *
 * @param {import('pg').PoolClient} params.client
 * Active database transaction client.
 *
 * @param {(id: string, client: import('pg').PoolClient) => Promise<Object|null>} params.getBatchFn
 * Repository function that retrieves the batch record.
 *
 * @param {(params: Object, client: import('pg').PoolClient) => Promise<Object>} params.updateBatchFn
 * Repository function that performs the batch update.
 *
 * @param {Record<string,string[]>} params.editRules
 * Editable field whitelist per lifecycle state.
 *
 * @param {Record<string,string[]>} params.statusTransitions
 * Allowed lifecycle transitions.
 *
 * @param {'product'|'packaging_material'} params.batchType
 * Batch domain used for activity logging.
 *
 * @param {(statusId: string) => string} params.activityTypeResolver
 * Resolver mapping a status_id to a batch activity type ID.
 *
 * @returns {Promise<Object>}
 * Updated batch record returned from the repository layer.
 */
const updateBatchWorkflow = async ({
                                     batchId,
                                     updates,
                                     actorId,
                                     client,
                                     getBatchFn,
                                     updateBatchFn,
                                     editRules,
                                     statusTransitions,
                                     batchType,
                                     activityTypeResolver
                                   }) => {
  //------------------------------------------------------------
  // 1. Fetch current batch state
  //------------------------------------------------------------
  const batch = await getBatchFn(batchId, client);
  
  if (!batch) {
    throw AppError.notFoundError('Batch not found.');
  }
  
  // Determine whether a lifecycle status change is requested
  const nextStatus = updates?.status_id ?? null;
  
  //------------------------------------------------------------
  // 2. Prepare metadata updates
  //------------------------------------------------------------
  // Filters updates based on editable fields for the current lifecycle state
  const {
    safeUpdates,
    hasMetadataUpdates
  } = prepareMetadataUpdates({
    batch,
    updates,
    editRules
  });
  
  //------------------------------------------------------------
  // 3. Apply lifecycle transition engine
  //------------------------------------------------------------
  // Handles:
  // - transition validation
  // - lifecycle automation (timestamps)
  const {
    lifecycleUpdates,
    isStatusChange
  } = applyLifecycleTransition({
    batch,
    nextStatus,
    actorId,
    statusTransitions
  });
  
  //------------------------------------------------------------
  // 4. Merge updates
  //------------------------------------------------------------
  const finalUpdates = {
    ...safeUpdates,
    ...lifecycleUpdates
  };
  
  //------------------------------------------------------------
  // 5. Update batch record
  //------------------------------------------------------------
  const updatedBatch = await updateBatchFn(
    {
      batchId,
      ...finalUpdates,
      updatedBy: actorId
    },
    client
  );
  
  //------------------------------------------------------------
  // 6. Build activity log rows
  //------------------------------------------------------------
  const activityRows =
    buildBatchActivities({
      batch,
      batchType,
      actorId,
      nextStatus,
      isStatusChange,
      hasMetadataUpdates,
      updates: finalUpdates,
      activityTypeResolver
    });
  
  //------------------------------------------------------------
  // 7. Insert activity logs
  //------------------------------------------------------------
  if (activityRows.length > 0) {
    await insertBatchActivityLogsBulk(activityRows, client);
  }
  
  return updatedBatch;
};

module.exports = {
  registerBatchWorkflow,
  updateBatchWorkflow,
};
