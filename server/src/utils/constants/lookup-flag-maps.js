/**
 * @file lookup-flag-maps.js
 * @description ACL flag maps for lookup transformers.
 *
 * Maps ACL key names to derived row property names. Passed as the third
 * argument to includeFlagsBasedOnAccess to control which flags are included
 * in lookup dropdown output based on the user's resolved access level.
 *
 * Each map is domain-specific — ACL key names must match the properties
 * returned by the corresponding evaluate* function in the business layer.
 *
 * Exports:
 *  - STANDARD_FLAG_MAP          — general lookup: isActive, isValidToday, isArchived
 *  - STATUS_ONLY_FLAG_MAP       — status-only lookup: isActive
 *  - PRICING_GROUP_FLAG_MAP     — pricing group lookup: isActive, isValidToday
 */

'use strict';

/**
 * Standard flag map for lookup domains that expose the full set of status flags.
 *
 * @type {FlagMap}
 */
const STANDARD_FLAG_MAP = {
  canViewAllStatuses: 'isActive',
  canViewAllValidLookups: 'isValidToday',
  canViewArchived: 'isArchived',
};

/**
 * Minimal flag map for lookup domains that only expose active/inactive state.
 *
 * @type {FlagMap}
 */
const STATUS_ONLY_FLAG_MAP = {
  canViewAllStatuses: 'isActive',
};

/**
 * Flag map for pricing group lookup row visibility.
 *
 * Maps ACL keys from PricingGroupLookupAcl to derived boolean fields
 * added by enrichPricingGroupRow. Each flag is only included in the
 * transformed output when the corresponding ACL key is true.
 *
 * Used with includeFlagsBasedOnAccess in transformPricingGroupLookupRow.
 *
 @type {FlagMap}
 */
const PRICING_GROUP_FLAG_MAP = {
  canViewAllPricingStates: 'isActive',
  canViewAllValidPricing: 'isValidToday',
};

/**
 * Flag map for batch registry lookup row visibility.
 *
 * Maps ACL keys from BatchRegistryLookupAcl to row fields surfaced by
 * the batch registry lookup query. Each field is only included in the
 * transformed output when the corresponding ACL key is true.
 *
 * Used with includeFlagsBasedOnAccess in transformBatchRegistryLookupRow.
 *
 * @type {FlagMap}
 */
const BATCH_REGISTRY_FLAG_MAP = {
  canViewAllBatches: 'isExpired',
  canViewAllBatchStatus: 'isReleased',
};

/**
 * Flag map for inventory status lookup row visibility.
 *
 * Maps ACL keys from InventoryStatusLookupAcl to row fields surfaced by
 * the inventory status lookup query. Each field is only included in the
 * transformed output when the corresponding ACL key is true.
 *
 * Used with includeFlagsBasedOnAccess in transformInventoryStatusLookup.
 *
 * @type {FlagMap}
 */
const INVENTORY_STATUS_FLAG_MAP = {
  canViewInactive: 'isActive',
};

/**
 * Flag map for pricing type lookup row visibility.
 *
 * Maps ACL keys from PricingTypeLookupAcl to row fields surfaced by the
 * pricing type lookup query. Each field is only included in the
 * transformed output when the corresponding ACL key is true.
 *
 * Used with includeFlagsBasedOnAccess in transformPricingTypeLookup.
 *
 * @type {FlagMap}
 */
const PRICING_TYPE_FLAG_MAP = {
  canViewInactive: 'isActive',
};

/**
 * Flag map for warehouse type lookup row visibility.
 *
 * Maps ACL keys from WarehouseTypeLookupAcl to row fields surfaced by the
 * warehouse type lookup query. Each field is only included in the
 * transformed output when the corresponding ACL key is true.
 *
 * Used with includeFlagsBasedOnAccess in transformWarehouseTypeLookup.
 *
 * @type {FlagMap}
 */
const WAREHOUSE_TYPE_FLAG_MAP = {
  canViewInactive: 'isActive',
};

module.exports = {
  STANDARD_FLAG_MAP,
  STATUS_ONLY_FLAG_MAP,
  PRICING_GROUP_FLAG_MAP,
  BATCH_REGISTRY_FLAG_MAP,
  INVENTORY_STATUS_FLAG_MAP,
  PRICING_TYPE_FLAG_MAP,
  WAREHOUSE_TYPE_FLAG_MAP,
};
