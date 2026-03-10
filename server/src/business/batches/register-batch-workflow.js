const { insertBatchRegistryBulk } = require('../../repositories/batch-registry-repository');
const { insertBatchActivityLogsBulk } = require('../../repositories/batch-activity-log-repository');

/**
 * Register newly created batches and record activity logs.
 *
 * This workflow orchestrates the creation of batches and ensures the following
 * actions occur atomically within a transaction:
 *
 * 1. Insert batch records using the provided batch insert function.
 * 2. Register each batch in the `batch_registry` table.
 * 3. Record a batch creation activity in `batch_activity_logs`.
 *
 * This workflow supports both product batches and packaging material batches
 * through the `batchType` parameter and a pluggable batch insert function.
 *
 * Performance:
 * - Uses bulk operations for batch insertion, registry creation, and activity logging.
 * - Avoids additional database queries by using returned batch IDs directly.
 *
 * Data Integrity:
 * - Ensures each created batch has a corresponding registry entry.
 * - Ensures a batch activity log entry is recorded for auditability.
 *
 * @async
 * @function registerBatchWorkflow
 *
 * @param {Object} params
 * Workflow parameters.
 *
 * @param {'product'|'packaging_material'} params.batchType
 * Type of batch being registered.
 *
 * @param {Array<Object>} params.batches
 * Batch records to insert.
 *
 * @param {Function} params.insertBatchFn
 * Repository function used to insert batch records.
 *
 * @param {string} params.batchCreatedActivityTypeId
 * Activity type ID representing batch creation.
 *
 * @param {string|null} params.actorId
 * User responsible for creating the batch.
 *
 * @param {Object} params.client
 * PostgreSQL transaction client.
 *
 * @returns {Promise<Array<Object>>}
 * Returns the inserted batch records.
 */
const registerBatchWorkflow = async ({
                                       batchType,
                                       batches,
                                       insertBatchFn,
                                       batchCreatedActivityTypeId,
                                       actorId,
                                       client,
                                     }) => {
  // -------------------------------------------------------------
  // Step 1: Insert batch records
  // -------------------------------------------------------------
  const insertedBatches = await insertBatchFn(batches, client);
  
  // -------------------------------------------------------------
  // Step 2: Register batches in batch_registry
  // -------------------------------------------------------------
  const registryRows = insertedBatches.map((batch) => ({
    batch_type: batchType,
    product_batch_id: batchType === 'product' ? batch.id : null,
    packaging_material_batch_id:
      batchType === 'packaging_material' ? batch.id : null,
    registered_by: actorId,
    note: batch.registryNote ?? 'Batch registered during creation',
  }));
  
  const registry = await insertBatchRegistryBulk(registryRows, client);
  
  // Defensive safety check (optional)
  if (registry.length !== insertedBatches.length) {
    throw new Error('Batch registry creation mismatch.');
  }
  
  // -------------------------------------------------------------
  // Step 3: Record batch creation activity logs
  // -------------------------------------------------------------
  const activityRows = registry.map((r, index) => {
    const batch = insertedBatches[index];
    
    return {
      batch_registry_id: r.id,
      batch_type: batchType,
      batch_activity_type_id: batchCreatedActivityTypeId,
      previous_value: null,
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
  
  await insertBatchActivityLogsBulk(activityRows, client);
  
  return insertedBatches;
};

module.exports = {
  registerBatchWorkflow,
};
