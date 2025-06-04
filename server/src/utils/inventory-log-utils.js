const AppError = require('./AppError');
const { cleanObject } = require('./object-utils');
const { generateChecksum } = require('./crypto-utils');

/**
 * Builds inventory activity log entries (for both active and audit tables).
 *
 * Each record should include:
 * - Either `warehouse_inventory_id` or `location_inventory_id`
 * - `inventory_action_type_id` (required)
 * - `status_id`, `created_by`, `quantity`, and `status_date`
 *
 * Optional:
 * - `adjustment_type_id`, `order_id`, `comments`, `metadata`, `source_type`, `source_ref_id`
 *
 * @param {Array<Object>} records - Enriched warehouse or location inventory records.
 * @returns {Array<Object>} Structured log objects with checksum for insertion.
 */
const buildInventoryLogRows = (records) => {
  return records.map((record) => {
    if (!record.warehouse_inventory_id && !record.location_inventory_id) {
      throw AppError.validationError('Either warehouse_inventory_id or location_inventory_id must be provided');
    }
    
    const isWarehouse = Boolean(record.warehouse_inventory_id);
    const inventoryFieldKey = isWarehouse ? 'warehouse_inventory_id' : 'location_inventory_id';
    const inventoryId = record[inventoryFieldKey] ?? record.id ?? null;
    
    const scope = isWarehouse ? 'warehouse' : 'location';
    
    const checksumPayload = cleanObject({
      [inventoryFieldKey]: inventoryId,
      inventory_action_type_id: record.inventory_action_type_id,
      adjustment_type_id: record.adjustment_type_id || null,
      order_id: record.order_id || null,
      quantity_change: record.quantity,
      new_quantity: record.quantity,
      status_id: record.status_id,
      status_effective_at: record.status_date,
      performed_by: record.user_id,
      comments: record.comments,
      recorded_by: record.user_id,
      inventory_scope: scope,
      source_type: record.source_type || null,
      source_ref_id: record.source_ref_id || null,
      metadata: { source: record.source_type, ...(record.metadata || {}) },
    });
    
    return {
      [inventoryFieldKey]: inventoryId,
      inventory_action_type_id: record.inventory_action_type_id,
      adjustment_type_id: record.adjustment_type_id || null,
      order_id: record.order_id || null,
      previous_quantity: 0,
      quantity_change: record.quantity,
      new_quantity: record.quantity,
      status_id: record.status_id,
      status_effective_at: record.status_date,
      performed_by: record.user_id,
      recorded_by: record.user_id,
      comments: record.comments || null,
      metadata: checksumPayload.metadata,
      source_type: record.source_type || null,
      source_ref_id: record.source_ref_id || null,
      inventory_scope: scope,
      checksum: generateChecksum(checksumPayload),
    };
  });
};

/**
 * Validates a single inventory log entry by verifying its checksum.
 *
 * @param {Object} record - Full inventory log record (typically fetched from DB).
 * @returns {boolean} - True if checksum is valid.
 * @throws {Error} - If checksum mismatch is detected.
 */
const validateInventoryLogChecksum = (record) => {
  const isWarehouse = Boolean(record.warehouse_inventory_id || record.inventory_scope === 'warehouse');
  const inventoryFieldKey = isWarehouse ? 'warehouse_inventory_id' : 'location_inventory_id';
  const inventoryId = record[inventoryFieldKey];
  
  const checksumPayload = cleanObject({
    [inventoryFieldKey]: inventoryId,
    inventory_action_type_id: record.inventory_action_type_id,
    adjustment_type_id: record.adjustment_type_id || null,
    order_id: record.order_id || null,
    quantity_change: record.quantity_change,
    new_quantity: record.new_quantity,
    status_id: record.status_id,
    status_effective_at: record.status_effective_at,
    performed_by: record.user_id,
    recorded_by: record.user_id,
    inventory_scope: record.inventory_scope,
    source_type: record.source_type || null,
    source_ref_id: record.source_ref_id || null,
    metadata: record.metadata,
  });
  
  const generatedChecksum = generateChecksum(checksumPayload);
  
  if (generatedChecksum !== record.checksum) {
    throw new Error('Inventory log integrity check failed: checksum mismatch.');
  }
  
  return true;
};

module.exports = {
  buildInventoryLogRows,
  validateInventoryLogChecksum,
};
