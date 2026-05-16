/**
 * @file inventory-action-type-constants.js
 * @description Domain constants for the inventory action type module.
 *
 * Exports:
 *  - INVENTORY_ACTION_TYPE_CONSTANTS — ACL-layer permission keys and
 *    canonical category references
 */

'use strict';

const INVENTORY_ACTION_TYPE_CONSTANTS = {
  PERMISSIONS: {
    // ── Visibility overrides ──────────────────────────────────────────────────

    /** Allows viewing inactive inventory action types in the lookup. */
    VIEW_ALL_STATUSES: 'view_all_inventory_action_type_statuses',
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  //
  // String values must match the `category` column on inventory_action_types.
  // Used as a canonical reference for code that filters or scopes by category
  // (e.g. the lot adjustment type lookup pins category to ADJUSTMENT).
  //
  // Keep this object in sync with any new category values added to the table.

  CATEGORIES: {
    ADJUSTMENT: 'adjustment',
    CONVERSION: 'conversion',
    HOLD: 'hold',
    RESERVATION: 'reservation',
    SYSTEM: 'system',
    TRANSACTION: 'transaction',
    TRANSFER: 'transfer',
  },
};

module.exports = {
  INVENTORY_ACTION_TYPE_CONSTANTS,
};
