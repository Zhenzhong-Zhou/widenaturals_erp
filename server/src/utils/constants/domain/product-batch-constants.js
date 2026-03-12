/**
 * Defines which fields of a product batch may be edited depending
 * on the current lifecycle status of the batch.
 *
 * These rules apply to the `product_batches` table and are enforced
 * in the **business layer** before executing repository updates.
 *
 * Key principles:
 *
 * 1. Only operationally editable fields are listed here.
 * 2. Audit fields (`created_at`, `created_by`, `updated_at`, `updated_by`)
 *    are always managed by the server and must never come from client input.
 * 3. Lifecycle event fields (`received_*`, `released_*`) may only be edited
 *    when the batch reaches the corresponding operational stage.
 * 4. Identity fields such as `sku_id` must never be editable after creation.
 *
 * Typical lifecycle:
 *
 * pending → received → quarantined → released → consumed / archived
 *
 * NOTE:
 * These rules only define **which fields may be edited based on lifecycle**.
 * Permission checks are handled separately in
 * `PRODUCT_BATCH_PERMISSION_FIELD_RULES`.
 *
 * @type {Record<string, string[]>}
 */
const PRODUCT_BATCH_EDIT_RULES = {
  /**
   * Initial batch creation stage.
   *
   * The batch exists in the system but may still be corrected
   * before warehouse operations begin.
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
   * Batch has been physically received into warehouse inventory.
   *
   * Receipt metadata may still be recorded or corrected.
   */
  received: [
    'received_at',
    'received_by',
    'notes',
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch temporarily held due to QA inspection
   * or operational investigation.
   *
   * Only notes and lifecycle changes are allowed.
   */
  quarantined: [
    'notes',
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch approved by QA and released for operational use
   * (inventory allocation, manufacturing, fulfillment).
   *
   * Release metadata may be recorded.
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
 * Defines valid lifecycle status transitions for product batches.
 *
 * This prevents invalid workflow jumps such as:
 *
 * - released → pending
 * - consumed → released
 *
 * The business layer must validate transitions before applying
 * any status update.
 *
 * Terminal states such as `consumed`, `archived`, and `expired`
 * normally cannot transition further.
 *
 * Note:
 * `expired` batches are typically marked automatically by system
 * processes rather than manual transitions.
 *
 * @type {Record<string, string[]>}
 */
const PRODUCT_BATCH_STATUS_TRANSITIONS = {
  /**
   * Batch registered but not yet received by warehouse.
   */
  pending: [
    'received',
    'quarantined'
  ],
  
  /**
   * Batch received into warehouse inventory.
   */
  received: [
    'quarantined',
    'released'
  ],
  
  /**
   * Batch temporarily blocked due to quality inspection.
   */
  quarantined: [
    'released',
    'suspended'
  ],
  
  /**
   * Batch approved for operational use.
   */
  released: [
    'consumed',
    'archived',
    'suspended'
  ],
  
  /**
   * Suspended batches are blocked due to operational
   * or quality issues.
   */
  suspended: [
    'quarantined',
    'archived'
  ]
};

/**
 * Permission-based field editing rules for product batches.
 *
 * These rules define which fields a user may modify depending
 * on the permissions granted to their role.
 *
 * Validation must satisfy BOTH:
 *
 * 1. Lifecycle edit rules (`PRODUCT_BATCH_EDIT_RULES`)
 * 2. Permission rules (`PRODUCT_BATCH_PERMISSION_FIELD_RULES`)
 *
 * If either check fails, the update must be rejected.
 *
 * @type {Record<string, string[]>}
 */
const PRODUCT_BATCH_PERMISSION_FIELD_RULES = {
  /**
   * Basic metadata corrections.
   *
   * Used by warehouse staff to fix minor batch information.
   */
  edit_batch_metadata_basic: [
    'lot_number',
    'manufacture_date',
    'expiry_date',
    'manufacturer_id',
    'notes'
  ],
  
  /**
   * Sensitive operational metadata.
   *
   * These fields affect inventory integrity and must only
   * be modified by authorized operational roles.
   */
  edit_batch_metadata_sensitive: [
    'initial_quantity',
    'received_at'
  ],
  
  /**
   * Release and QA metadata.
   *
   * Used by QA or supervisory roles.
   */
  edit_batch_release_metadata: [
    'released_at',
    'released_by',
    'released_by_manufacturer_id'
  ],
  
  /**
   * Lifecycle status transitions.
   *
   * Changing status affects batch workflow and therefore
   * requires explicit permission.
   */
  change_batch_status: [
    'status_id',
    'status_date'
  ]
};

module.exports = {
  PRODUCT_BATCH_EDIT_RULES,
  PRODUCT_BATCH_STATUS_TRANSITIONS,
  PRODUCT_BATCH_PERMISSION_FIELD_RULES
};
