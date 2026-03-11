/**
 * Defines which batch fields are editable based on the current batch status.
 *
 * These rules apply to the `product_batches` table and are used by the
 * business layer to filter incoming update payloads before passing them
 * to the repository layer.
 *
 * Important rules:
 *
 * 1. Only business-editable fields are listed here.
 * 2. Audit fields (`created_at`, `created_by`, `updated_at`, `updated_by`)
 *    are always handled by the server and must never be passed from client input.
 * 3. Lifecycle event fields (`received_*`, `released_*`) are only editable
 *    when the batch reaches the corresponding operational stage.
 * 4. Fields that define batch identity (such as `sku_id`) should never
 *    be editable after creation.
 *
 * Typical lifecycle:
 *
 * pending → received → quarantined → released → consumed / archived
 *
 * @type {Record<string, string[]>}
 */
const BATCH_EDIT_RULES = {
  
  /**
   * Initial batch creation stage.
   *
   * At this stage the batch record may still be corrected before
   * any operational activity occurs.
   */
  pending: [
    'lot_number',
    'manufacture_date',
    'expiry_date',
    'manufacturer_id',
    'initial_quantity',
    'notes',
    'status_id'
  ],
  
  /**
   * Batch has been physically received by the warehouse.
   *
   * Receipt metadata may be recorded or corrected if needed.
   */
  received: [
    'received_at',
    'received_by',
    'notes',
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch is under QA inspection or quality hold.
   *
   * Only metadata and status changes should occur.
   */
  quarantined: [
    'notes',
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch has passed QA and is approved for operational use.
   *
   * Release metadata may be recorded during this stage.
   */
  released: [
    'released_at',
    'released_by',
    'released_by_manufacturer_id',
    'notes',
    'status_id'
  ]
};

/**
 * Defines valid status transitions for product batches.
 *
 * This prevents invalid lifecycle jumps such as:
 *
 * released → pending
 * consumed → released
 *
 * The business layer should validate that any status change
 * follows these rules before updating the batch record.
 *
 * Terminal statuses (`consumed`, `archived`, `expired`)
 * normally cannot transition to any other state.
 *
 * @type {Record<string, string[]>}
 */
const BATCH_STATUS_TRANSITIONS = {
  
  /**
   * Batch exists in system but has not yet been received
   * into warehouse operations.
   */
  pending: ['received', 'quarantined'],
  
  /**
   * Batch has been received and is awaiting QA decision.
   */
  received: ['quarantined', 'released'],
  
  /**
   * Batch is under quality inspection or hold.
   */
  quarantined: ['released', 'suspended'],
  
  /**
   * Batch has passed QA and is available for operations
   * such as inventory allocation or manufacturing use.
   */
  released: ['consumed', 'archived', 'suspended'],
  
  /**
   * Suspended batches are blocked due to quality or
   * operational issues.
   */
  suspended: ['quarantined', 'archived']
  
};

module.exports = {
  BATCH_EDIT_RULES,
  BATCH_STATUS_TRANSITIONS,
};
