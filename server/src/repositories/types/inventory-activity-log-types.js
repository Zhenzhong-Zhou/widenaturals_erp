/**
 * @file inventory-activity-log-types.js
 * @description JSDoc typedefs for the inventory activity log domain.
 *
 * Three categories of types:
 *   - Row types   — raw DB column aliases from repository queries
 *   - Record types — transformed UI-facing shapes
 *   - Filter types — filter input shapes for repository and service layers
 *   - Entry types  — insert input shapes for repository writes
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the inventory activity log queries.
 *
 * @typedef {Object} InventoryActivityLogRow
 * @property {string}      id
 * @property {string}      warehouse_inventory_id
 * @property {string}      inventory_action_type_id
 * @property {string|null} adjustment_type_id
 * @property {string}      batch_type
 * @property {string|null} product_lot_number
 * @property {string|null} product_name
 * @property {string|null} sku
 * @property {string|null} packaging_lot_number
 * @property {string|null} packaging_display_name
 * @property {string|null} packaging_material_code
 * @property {number}      previous_quantity
 * @property {number}      quantity_change
 * @property {number}      new_quantity
 * @property {string|null} reference_type
 * @property {string|null} reference_id
 * @property {string|null} comments
 * @property {string}      performed_by
 * @property {string}      performed_at
 * @property {Object|null} metadata
 * @property {string}      action_type_name
 * @property {string}      action_type_category
 * @property {string|null} adjustment_type_name
 * @property {string}      status_id
 * @property {string}      status_name
 * @property {string}      status_effective_at
 * @property {string}      performed_by_firstname
 * @property {string}      performed_by_lastname
 * @property {string}      warehouse_id
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed inventory activity log entry returned to the client.
 *
 * @typedef {Object} InventoryActivityLogRecord
 * @property {string}        id
 * @property {string}        warehouseInventoryId
 * @property {string}        batchType              - Discriminates product vs packaging batch context.
 * @property {number}        previousQuantity
 * @property {number}        quantityChange
 * @property {number}        newQuantity
 * @property {string}        actionTypeName
 * @property {string}        actionTypeCategory
 * @property {string|null}   adjustmentTypeName
 * @property {GenericStatus} status
 * @property {string|null}   referenceType
 * @property {string|null}   referenceId
 * @property {string|null}   comments
 * @property {Object|null}   metadata
 * @property {string}        performedAt
 * @property {string}        performedByName
 * @property {string|null}   productLotNumber       - Populated when batch_type is product; null otherwise.
 * @property {string|null}   productName            - Populated when batch_type is product; null otherwise.
 * @property {string|null}   sku                    - Populated when batch_type is product; null otherwise.
 * @property {string|null}   packagingLotNumber     - Populated when batch_type is packaging; null otherwise.
 * @property {string|null}   packagingDisplayName   - Populated when batch_type is packaging; null otherwise.
 * @property {string|null}   packagingMaterialCode  - Populated when batch_type is packaging; null otherwise.
 */

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} InventoryActivityLogFilters
 * @property {string}  warehouseId          - Required. UUID of the warehouse to scope the query.
 * @property {string}  [inventoryId]        - Filter by specific inventory record UUID.
 * @property {string}  [actionTypeId]       - Filter by action type UUID.
 * @property {string}  [adjustmentTypeId]   - Filter by adjustment type UUID.
 * @property {string}  [referenceType]      - Filter by reference type string.
 * @property {string}  [performedBy]        - Filter by performer user UUID.
 * @property {string}  [performedAtAfter]   - ISO date string — lower bound on performed_at.
 * @property {string}  [performedAtBefore]  - ISO date string — upper bound on performed_at.
 */

// ---------------------------------------------------------------------------
// Entry types (insert shapes)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} InventoryActivityLogEntry
 * @property {string}      warehouse_inventory_id
 * @property {string}      inventory_action_type_id
 * @property {string|null} [adjustment_type_id]
 * @property {number}      previous_quantity
 * @property {number}      quantity_change
 * @property {number}      new_quantity
 * @property {string|null} [status_id]
 * @property {string|null} [status_effective_at]
 * @property {string|null} [reference_type]
 * @property {string|null} [reference_id]
 * @property {string}      performed_by
 * @property {string|null} [comments]
 * @property {string}      checksum
 * @property {Object|null} [metadata]
 * @property {string|null} [created_by]
 */
