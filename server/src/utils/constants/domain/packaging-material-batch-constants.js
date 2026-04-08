/**
 * Editable field rules for packaging material batches.
 *
 * This configuration defines which fields may be updated depending
 * on the current lifecycle status of a batch.
 *
 * The rules are enforced in the **business layer** before executing
 * any repository update queries against the `packaging_material_batches` table.
 *
 * Key principles:
 *
 * 1. Only operational fields are listed here.
 * 2. Audit fields (`created_at`, `created_by`, `updated_at`, `updated_by`)
 *    are always controlled by the server and never editable by clients.
 * 3. Receipt metadata (`received_*`) can only be recorded once the batch
 *    has physically arrived at the warehouse.
 * 4. Identity fields such as supplier reference should generally remain
 *    immutable after creation to preserve traceability.
 *
 * Typical lifecycle:
 *
 * pending → received → quarantined → released → consumed / archived
 *
 * NOTE:
 * These rules only control **which fields may be edited**. Actual permission
 * checks (RBAC) are handled separately in `PACKAGING_BATCH_PERMISSION_FIELD_RULES`.
 *
 * @type {Record<string, string[]>}
 */
const PACKAGING_BATCH_EDIT_RULES = {
  /**
   * Initial registration stage.
   *
   * The batch record exists but the physical goods may not yet
   * have been received in the warehouse.
   *
   * Most metadata can still be corrected during this stage.
   */
  pending: [
    'packaging_material_supplier_id',
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
    'notes',
    'status_id'
  ],
  
  /**
   * Batch has been physically received into warehouse inventory.
   *
   * Only limited corrections are allowed. Receipt metadata may
   * still be adjusted if errors were made during intake.
   */
  received: [
    'lot_number',
    'material_snapshot_name',
    'received_label_name',
    'unit',
    'manufacture_date',
    'expiry_date',
    'notes',
    
    // Receipt metadata
    'received_at',
    'received_by',
    
    // Lifecycle control
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch temporarily blocked due to inspection,
   * QA review, or operational issues.
   *
   * Only lifecycle transitions are allowed.
   */
  quarantined: [
    'notes',
    'status_id',
    'status_date'
  ],
  
  /**
   * Batch approved for operational usage.
   *
   * At this point the batch should be considered stable
   * and metadata changes are no longer allowed.
   *
   * Only lifecycle transitions may occur.
   */
  released: [
    'notes',
    'status_id'
  ]
};

//------------------------------------------------------------
// Packaging material batch lifecycle state machine
//------------------------------------------------------------

/**
 * Valid lifecycle transitions for packaging material batches.
 *
 * This configuration defines the allowed **state transitions**
 * for packaging material batch records. It acts as a lightweight
 * state machine used by the business layer to validate lifecycle
 * changes before applying any updates.
 *
 * Purpose:
 * - Prevent invalid transitions such as:
 *     released → pending
 *     consumed → received
 * - Ensure terminal states cannot transition further.
 * - Provide a centralized definition of lifecycle behavior.
 *
 * Validation usage example (business layer):
 *
 * const allowed = PACKAGING_BATCH_STATUS_TRANSITIONS[currentStatus];
 * if (!allowed.includes(targetStatus)) {
 *   throw AppError.validationError(
 *     `Invalid lifecycle transition: ${currentStatus} → ${targetStatus}`
 *   );
 * }
 *
 * Lifecycle design principles:
 * - Terminal states return an empty array.
 * - Only forward lifecycle movement is allowed.
 * - Operational exceptions (e.g. suspended) may allow recovery.
 *
 * Performance:
 * - The configuration is a static object loaded once at
 *   module initialization.
 * - Status checks are O(1) lookups followed by a small array check.
 *
 * @type {Record<string, string[]>}
 */
const PACKAGING_BATCH_STATUS_TRANSITIONS = {
  
  /**
   * Batch registered in the system but not yet received
   * into warehouse inventory.
   */
  pending: [
    'received',      // warehouse intake completed
    'quarantined',   // batch held for inspection
    'rejected'       // intake rejected immediately
  ],
  
  /**
   * Batch has physically arrived at the warehouse.
   */
  received: [
    'quarantined',   // QA inspection required
    'released',      // approved for use
    'rejected'       // rejected during intake inspection
  ],
  
  /**
   * Batch temporarily held for quality inspection
   * or operational investigation.
   */
  quarantined: [
    'released',      // inspection passed
    'rejected',      // inspection failed
    'suspended'      // operational hold
  ],
  
  /**
   * Batch approved for operational use in manufacturing
   * or packaging processes.
   */
  released: [
    'consumed',      // fully used in production
    'expired',       // shelf-life expired
    'suspended',     // blocked due to operational issues
    'archived'       // archived after lifecycle completion
  ],
  
  /**
   * Batch temporarily blocked due to operational
   * or quality issues.
   */
  suspended: [
    'quarantined',   // return to inspection
    'released',      // issue resolved
    'archived'       // permanently archived
  ],
  
  /**
   * Batch rejected during inspection or intake.
   *
   * Terminal state — no further transitions allowed.
   */
  rejected: [],
  
  /**
   * Batch expired (possible for certain materials
   * such as adhesives, liners, or chemical components).
   *
   * Terminal state.
   */
  expired: [],
  
  /**
   * Batch fully consumed in manufacturing operations.
   *
   * Terminal state.
   */
  consumed: [],
  
  /**
   * Batch archived for historical or compliance
   * recordkeeping.
   *
   * Terminal state.
   */
  archived: []
};

/**
 * Permission-based field control for packaging batch updates.
 *
 * These rules define which fields a user may modify based on
 * their granted permissions.
 *
 * This layer works together with `PACKAGING_BATCH_EDIT_RULES`:
 *
 * - `EDIT_RULES` → lifecycle restrictions
 * - `PERMISSION_RULES` → RBAC restrictions
 *
 * Both must pass before an update is allowed.
 *
 * Example validation order:
 *
 * 1. Check user permission
 * 2. Check lifecycle edit rules
 * 3. Filter allowed fields
 * 4. Execute repository update
 *
 * @type {Record<string, string[]>}
 */
const PACKAGING_BATCH_PERMISSION_FIELD_RULES = {
  /**
   * Basic metadata edits.
   *
   * Low-risk corrections such as label names or lot numbers.
   */
  edit_batch_metadata_basic: [
    'material_snapshot_name',
    'received_label_name',
    'lot_number',
    'manufacture_date',
    'expiry_date',
    'unit',
    'notes',
  ],
  
  /**
   * Sensitive metadata edits.
   *
   * Includes supplier identity, financial data,
   * and receipt timestamps.
   *
   * Typically restricted to higher roles.
   */
  edit_batch_metadata_sensitive: [
    'packaging_material_supplier_id',
    'quantity',
    'unit_cost',
    'currency',
    'exchange_rate',
    'total_cost',
    'received_at',
  ],
  
  /**
   * Permission allowing lifecycle status transitions.
   */
  change_batch_status: [
    'status_id',
    'notes'
  ]
};

module.exports = {
  PACKAGING_BATCH_EDIT_RULES,
  PACKAGING_BATCH_STATUS_TRANSITIONS,
  PACKAGING_BATCH_PERMISSION_FIELD_RULES,
};
