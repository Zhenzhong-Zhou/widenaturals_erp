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
} = require('./batch-update-helpers');

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
 * Generic batch update workflow shared by batch domains such as
 * product batches and packaging material batches.
 *
 * Responsibilities:
 * - loads the current batch record
 * - resolves user access control used for permission checks and lifecycle overrides
 * - normalizes the incoming update payload
 * - validates and filters update fields using lifecycle edit rules and permission restrictions
 * - validates lifecycle status transitions
 * - applies lifecycle automation timestamps (for example `received_at`, `released_at`)
 * - updates the batch record through the repository layer
 * - generates lifecycle and metadata activity log entries
 * - persists activity logs within the same transaction
 *
 * This workflow is intended to centralize shared mutation logic so that
 * product batch and packaging material batch services stay consistent.
 *
 * @param {Object} params
 * @param {string} params.batchId - Unique batch identifier.
 * @param {Object} params.updates - Partial batch fields requested for update.
 * @param {Object} params.user - Authenticated user performing the operation.
 * @param {import('pg').PoolClient} params.client - Active database transaction client.
 *
 * @param {(id: string, client: import('pg').PoolClient) => Promise<Object|null>} params.getBatchFn
 * Repository function that retrieves the current batch record.
 *
 * @param {(params: Object, client: import('pg').PoolClient) => Promise<Object>} params.updateBatchFn
 * Repository function that updates the batch record.
 *
 * @param {Record<string, string[]>} params.editRules
 * Editable field whitelist grouped by current lifecycle status.
 *
 * @param {Record<string, string[]>} params.statusTransitions
 * Allowed lifecycle transitions grouped by current lifecycle status.
 *
 * @param {'product'|'packaging_material'} params.batchType
 * Batch domain used when building activity log rows.
 *
 * @param {(statusId: string) => string} params.activityTypeResolver
 * Resolver that maps a status ID to a batch activity type ID.
 *
 * @param {(user: Object) => Promise<Object>} params.evaluateAccessControlFn
 * Function that resolves access flags for the current user.
 *
 * @param {(params: {
 *   batch: Object,
 *   updates: Object,
 *   access: Object,
 *   editRules: Record<string, string[]>
 * }) => Object} params.filterUpdatableFieldsFn
 * Function that validates and filters update fields based on lifecycle
 * edit rules and permission restrictions, returning a safe update payload.
 *
 * @returns {Promise<Object>}
 * Updated batch record returned by the repository layer.
 */
const updateBatchWorkflow = async ({
                                     batchId,
                                     updates,
                                     user,
                                     client,
                                     
                                     // repositories
                                     getBatchFn,
                                     updateBatchFn,
                                     
                                     // lifecycle configuration
                                     editRules,
                                     statusTransitions,
                                     
                                     // domain
                                     batchType,
                                     activityTypeResolver,
                                     
                                     // security
                                     evaluateAccessControlFn,
                                     
                                     // validation
                                     filterUpdatableFieldsFn,
                                   }) => {
  const actorId = user.id;
  
  //------------------------------------------------------------
  // 1. Load current batch state
  //------------------------------------------------------------
  const batch = await getBatchFn(batchId, client);
  
  if (!batch) {
    throw AppError.notFoundError('Batch not found.');
  }
  
  //------------------------------------------------------------
  // 2. Resolve access control
  //------------------------------------------------------------
  const access = await evaluateAccessControlFn(user);
  
  //------------------------------------------------------------
  // 3. Normalize update payload
  //------------------------------------------------------------
  const {
    safeUpdates,
    hasMetadataUpdates
  } = prepareMetadataUpdates({
    updates
  });
  
  //------------------------------------------------------------
  // 4. Enforce lifecycle + permission rules
  //------------------------------------------------------------
  const permittedUpdates = filterUpdatableFieldsFn({
    batch,
    updates: safeUpdates,
    access,
    editRules,
  });
  
  //------------------------------------------------------------
  // 5. Apply lifecycle transition logic
  //------------------------------------------------------------
  const nextStatus = permittedUpdates?.status_id ?? null;
  
  const {
    lifecycleUpdates,
    isStatusChange
  } = applyLifecycleTransition({
    batch,
    nextStatus,
    actorId,
    statusTransitions,
    access
  });
  
  //------------------------------------------------------------
  // 6. Merge updates
  //------------------------------------------------------------
  const finalUpdates = {
    ...permittedUpdates,
    ...lifecycleUpdates
  };
  
  //------------------------------------------------------------
  // 7. Persist update
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
  // 8. Build activity logs
  //------------------------------------------------------------
  const activityRows = buildBatchActivities({
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
  // 9. Persist activity logs
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
