/**
 * @file lot-adjustment-type-constants.js
 * @description Domain constants for the lot adjustment type module.
 *
 * Exports:
 *  - LOT_ADJUSTMENT_TYPE_CONSTANTS — ACL-layer permission keys and
 *    reserved-name constants
 */

'use strict';

const LOT_ADJUSTMENT_TYPE_CONSTANTS = {
  PERMISSIONS: {
    // ── Visibility overrides ──────────────────────────────────────────────────

    /** Allows viewing inactive lot adjustment types in the lookup. */
    VIEW_ALL_STATUSES: 'view_all_lot_adjustment_type_statuses',

    /**
     * Allows viewing internal stock management types
     * (e.g. manual_stock_insert, manual_stock_update) in the lookup.
     */
    VIEW_INTERNAL: 'view_internal_lot_adjustment_types',
  },

  // ── Reserved names ──────────────────────────────────────────────────────────

  /**
   * Lot adjustment type names reserved for internal system operations.
   * Excluded from user-facing dropdowns unless the caller holds
   * VIEW_INTERNAL.
   */
  INTERNAL_TYPE_NAMES: ['manual_stock_insert', 'manual_stock_update'],
};

module.exports = {
  LOT_ADJUSTMENT_TYPE_CONSTANTS,
};
