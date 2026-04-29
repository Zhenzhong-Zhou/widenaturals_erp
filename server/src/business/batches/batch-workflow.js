/**
 * @file batch-workflow.js
 * @description Domain workflow orchestrators for batch registration and update
 * operations. Coordinates access control, lifecycle transitions, field
 * filtering, persistence, and activity logging in a single reusable pipeline.
 */

'use strict';

const {
  insertBatchRegistryBulk,
} = require('../../repositories/batch-registry-repository');
const {
  insertBatchActivityLogsBulk,
} = require('../../repositories/batch-activity-log-repository');
const AppError = require('../../utils/AppError');
const {
  buildBatchRegistryRows,
  buildBatchActivityRows,
} = require('./batch-activity-builder');
const {
  prepareMetadataUpdates,
  applyLifecycleTransition,
  buildBatchActivities,
} = require('./batch-update-helpers');

/**
 * Orchestrates bulk batch registration — inserts batch records, registers them
 * in the batch registry, and records creation activity logs.
 *
 * @param {object} options
 * @param {string} options.batchType - Batch type string (e.g. `'product'`).
 * @param {object[]} options.batches - Array of batch payloads to register.
 * @param {Function} options.insertBatchFn - Async function that inserts batch records.
 * @param {string} options.batchCreatedActivityTypeId - Activity type ID for creation events.
 * @param {string} options.actorId - UUID of the user performing the registration.
 * @param {import('pg').PoolClient} options.client - Active transaction client.
 * @returns {Promise<object[]>} Inserted batch records.
 * @throws {AppError} validationError if no batches are provided.
 * @throws {AppError} businessError if insert or registry creation fails.
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

  // 1. Insert batch records.
  const insertedBatches = await insertBatchFn(batches, client);

  if (!insertedBatches?.length) {
    throw AppError.businessError('Failed to insert batch records.');
  }

  // 2. Register batches in batch_registry.
  const registryRows = buildBatchRegistryRows({
    batchType,
    insertedBatches,
    actorId,
  });

  const registry = await insertBatchRegistryBulk(registryRows, client);

  if (registry.length !== insertedBatches.length) {
    throw AppError.businessError('Batch registry creation mismatch.');
  }

  // 3. Record batch creation activity logs.
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
 * Orchestrates a batch update — resolves access control, normalizes and filters
 * the update payload, applies lifecycle transitions, persists the update, and
 * records activity logs.
 *
 * @param {object} options
 * @param {string} options.batchId - UUID of the batch to update.
 * @param {object} options.updates - Raw update payload from the caller.
 * @param {AuthUser} options.user - Authenticated user performing the update.
 * @param {import('pg').PoolClient} options.client - Active transaction client.
 * @param {Function} options.getBatchFn - Async function that fetches the current batch record.
 * @param {Function} options.updateBatchFn - Async function that persists the updated batch.
 * @param {Record<string, string[]>} options.editRules - Lifecycle edit rules map.
 * @param {Record<string, string[]>} options.statusTransitions - Permitted status transition map.
 * @param {string} options.batchType - Batch type string (e.g. `'product'`).
 * @param {Function} options.activityTypeResolver - Function that maps a status ID to an activity type ID.
 * @param {Function} options.evaluateAccessControlFn - Async function that resolves the ACL for the user.
 * @param {Function} options.filterUpdatableFieldsFn - Function that filters updates to permitted fields.
 * @returns {Promise<object>} Updated batch record.
 * @throws {AppError} notFoundError if the batch does not exist.
 */
const updateBatchWorkflow = async ({
  batchId,
  updates,
  user,
  client,
  getBatchFn,
  updateBatchFn,
  editRules,
  statusTransitions,
  batchType,
  activityTypeResolver,
  evaluateAccessControlFn,
  filterUpdatableFieldsFn,
}) => {
  const actorId = user.id;

  // 1. Load current batch state.
  const batch = await getBatchFn(batchId, client);

  if (!batch) {
    throw AppError.notFoundError('Batch not found.');
  }

  // 2. Resolve access control.
  const access = await evaluateAccessControlFn(user);

  // 3. Normalize update payload.
  const { safeUpdates, hasMetadataUpdates } = prepareMetadataUpdates({
    updates,
  });

  // 4. Enforce lifecycle and permission rules.
  const permittedUpdates = filterUpdatableFieldsFn({
    batch,
    updates: safeUpdates,
    access,
    editRules,
  });

  // 5. Apply lifecycle transition logic.
  const nextStatus = permittedUpdates?.status_id ?? null;

  const { lifecycleUpdates, isStatusChange } = applyLifecycleTransition({
    batch,
    nextStatus,
    actorId,
    statusTransitions,
    access,
    updates,
  });

  // 6. Merge permitted and lifecycle-driven updates.
  const finalUpdates = {
    ...permittedUpdates,
    ...lifecycleUpdates,
  };

  // 7. Persist update.
  const updatedBatch = await updateBatchFn(
    {
      batchId,
      ...finalUpdates,
      updatedBy: actorId,
    },
    client
  );

  // 8. Build and persist activity logs.
  const activityRows = buildBatchActivities({
    batch,
    batchType,
    actorId,
    nextStatus,
    isStatusChange,
    hasMetadataUpdates,
    updates: finalUpdates,
    activityTypeResolver,
  });

  if (activityRows.length > 0) {
    await insertBatchActivityLogsBulk(activityRows, client);
  }

  return updatedBatch;
};

module.exports = {
  registerBatchWorkflow,
  updateBatchWorkflow,
};
