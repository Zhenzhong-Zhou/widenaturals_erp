const { getBatchActivityTypeId } = require('../../../cache/batch-activity-type-cache');

/**
 * Allowed batch tables for verification helpers.
 */
const ALLOWED_BATCH_TABLES = new Set([
  'product_batches',
  'packaging_material_batches'
]);

/**
 * Fetch batch record for verification.
 *
 * Used in tests to confirm database updates after
 * service execution.
 *
 * @async
 *
 * @param {Object} client
 * Database client.
 *
 * @param {string} batchId
 * Batch identifier.
 *
 * @param {string} [tableName='product_batches']
 * Batch table name.
 *
 * @param {boolean} [print=true]
 * Whether to print the result to console.
 *
 * @returns {Promise<Object|null>}
 * Batch record or null if not found.
 */
const fetchBatchRecord = async (
  client,
  batchId,
  tableName = 'product_batches',
  print = true
) => {
  
  //------------------------------------------------------------
  // Validate table name
  //------------------------------------------------------------
  if (!ALLOWED_BATCH_TABLES.has(tableName)) {
    throw new Error(`Invalid batch table: ${tableName}`);
  }
  
  const { rows } = await client.query(
    `
    SELECT
      id,
      lot_number,
      notes,
      updated_at
    FROM ${tableName}
    WHERE id = $1
    `,
    [batchId]
  );
  
  const record = rows[0] ?? null;
  
  if (print) {
    console.table(rows);
  }
  
  return record;
};


/**
 * Fetch latest batch activity log.
 *
 * Used in tests to verify lifecycle or metadata
 * activity events recorded by the workflow engine.
 *
 * @async
 *
 * @param {Object} client
 * Database client.
 *
 * @param {string} batchRegistryId
 * Batch registry identifier.
 *
 * @param {string} activityTypeName
 * Activity type constant.
 *
 * @param {boolean} [print=true]
 * Whether to print the result to console.
 *
 * @returns {Promise<Object|null>}
 * Activity log entry or null if none found.
 */
const fetchBatchActivityLog = async (
  client,
  batchRegistryId,
  activityTypeName,
  print = true
) => {
  
  const activityTypeId = getBatchActivityTypeId(activityTypeName);
  
  const { rows } = await client.query(
    `
    SELECT
      id,
      batch_registry_id,
      batch_activity_type_id,
      previous_value,
      new_value,
      changed_at
    FROM batch_activity_logs
    WHERE batch_registry_id = $1
      AND batch_activity_type_id = $2
    ORDER BY changed_at DESC
    LIMIT 1
    `,
    [
      batchRegistryId,
      activityTypeId
    ]
  );
  
  const record = rows[0] ?? null;
  
  if (print) {
    console.table(rows);
  }
  
  return record;
};

module.exports = {
  fetchBatchRecord,
  fetchBatchActivityLog,
};
