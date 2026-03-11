/**
 * Defines which fields are editable for packaging material batches
 * based on the current batch status.
 *
 * These rules apply to the `packaging_material_batches` table and are
 * enforced in the business layer before repository updates are executed.
 *
 * Important rules:
 *
 * 1. Only operational fields are listed here.
 * 2. Audit fields (`created_at`, `created_by`, `updated_at`, `updated_by`)
 *    are always handled by the server.
 * 3. Receipt metadata (`received_*`) can only be set when the batch
 *    is received into the warehouse.
 * 4. Identity fields such as supplier reference should not change
 *    after creation.
 *
 * Typical lifecycle:
 *
 * pending → received → quarantined → released → consumed / archived
 *
 * @type {Record<string, string[]>}
 */
const PACKAGING_BATCH_EDIT_RULES = {
  
  /**
   * Initial creation stage.
   *
   * Batch may still be corrected before warehouse receipt.
   */
  pending: [
    'lot_number',
    'material_snapshot_name',
    'received_label_name',
    'quantity',
    'unit',
    'manufacture_date',
    'expiry_date',
    'unit_cost',
    'currency',
    'exchange_rate',
    'total_cost',
    'status_id'
  ],
  
  /**
   * Batch has been physically received into the warehouse.
   *
   * Receipt metadata may be recorded or corrected.
   */
  received: [
    'received_at',
    'received_by',
    'material_snapshot_name',
    'received_label_name',
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch is temporarily held due to inspection or operational issue.
   */
  quarantined: [
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch is approved and available for operational usage
   * such as packaging production.
   */
  released: [
    'status_id'
  ]
  
};

/**
 * Defines valid lifecycle transitions for packaging material batches.
 *
 * This prevents invalid state changes such as:
 *
 * released → pending
 * consumed → received
 *
 * Terminal states cannot transition further.
 *
 * @type {Record<string, string[]>}
 */
const PACKAGING_BATCH_STATUS_TRANSITIONS = {
  
  /**
   * Batch registered but not yet received.
   */
  pending: ['received', 'quarantined'],
  
  /**
   * Batch has been received into warehouse inventory.
   */
  received: ['quarantined', 'released'],
  
  /**
   * Batch temporarily blocked for inspection or issue resolution.
   */
  quarantined: ['released', 'suspended'],
  
  /**
   * Batch is approved and available for operational usage.
   */
  released: ['consumed', 'archived', 'suspended'],
  
  /**
   * Suspended batches are blocked from operational usage.
   */
  suspended: ['quarantined', 'archived']
  
};

module.exports = {
  PACKAGING_BATCH_EDIT_RULES,
  PACKAGING_BATCH_STATUS_TRANSITIONS,
};