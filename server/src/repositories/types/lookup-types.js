/**
 * @file lookup-types.js
 * @description JSDoc typedefs for lookup domain output shapes.
 *
 * These types describe the transformed UI-facing shapes produced by
 * lookup transformers. Input row types live in their respective domain
 * type files (e.g. customer-types.js, pricing-types.js).
 */

'use strict';

// ---------------------------------------------------------------------------
// Base lookup shapes
// ---------------------------------------------------------------------------

/**
 * Standard dropdown item used across all lookup domains.
 *
 * @typedef {Object} LookupItem
 * @property {string}  id
 * @property {string}  label
 * @property {string}  [subLabel]
 * @property {boolean} [isActive]
 * @property {boolean} [isValidToday]
 * @property {boolean} [isArchived]
 */

/**
 * Load-more paginated result wrapping an array of lookup items.
 *
 * @typedef {Object} LookupLoadMoreResult
 * @property {LookupItem[]} items
 * @property {number}       offset
 * @property {number}       limit
 * @property {boolean}      hasMore
 */

// ---------------------------------------------------------------------------
// Domain-specific lookup shapes
// ---------------------------------------------------------------------------

/**
 * Warehouse dropdown item.
 * Uses `value` instead of `id` to match the warehouse lookup contract.
 *
 * @typedef {Object} WarehouseLookupItem
 * @property {string}                    value
 * @property {string}                    label
 * @property {{ locationId: string }}    metadata
 */

/**
 * Lot adjustment type dropdown item.
 *
 * @typedef {Object} LotAdjustmentLookupItem
 * @property {string} value
 * @property {string} label
 * @property {string} actionTypeId
 */

/**
 * Batch registry lookup item.
 *
 * @typedef {Object} BatchRegistryLookupItem
 * @property {string}      id
 * @property {string}      type                  - `'product'` | `'packaging_material'`
 * @property {{
 *   id: string,
 *   name: string|null,
 *   lotNumber: string|null,
 *   expiryDate: string|null
 * }|null} product
 * @property {{
 *   id: string,
 *   lotNumber: string|null,
 *   expiryDate: string|null,
 *   snapshotName: string|null,
 *   receivedLabel: string|null
 * }|null} packagingMaterial
 */

/**
 * Customer address lookup item.
 *
 * @typedef {Object} CustomerAddressLookupItem
 * @property {string}      id
 * @property {string|null} recipient_name
 * @property {string|null} label
 * @property {string|null} formatted_address
 */

/**
 * Packaging material supplier lookup item.
 *
 * @typedef {Object} PackagingMaterialSupplierLookupItem
 * @property {string}      id
 * @property {string}      label
 * @property {string}      [subLabel]
 * @property {boolean}     isPreferred
 * @property {boolean}     [isActive]
 */

// ---------------------------------------------------------------------------
// Input row types (raw DB shapes for lookup queries)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the warehouse lookup query.
 *
 * @typedef {Object} WarehouseLookupRow
 * @property {string}      warehouse_id
 * @property {string}      warehouse_name
 * @property {string}      location_id
 * @property {string}      location_name
 * @property {string|null} warehouse_type_name
 */

/**
 * Raw DB row returned by the lot adjustment type lookup query.
 *
 * @typedef {Object} LotAdjustmentLookupRow
 * @property {string} lot_adjustment_type_id
 * @property {string} name
 * @property {string} inventory_action_type_id
 */

/**
 * Raw DB row returned by the pricing lookup query.
 *
 * @typedef {Object} PricingLookupRow
 * @property {string}      id
 * @property {string}      sku
 * @property {string}      product_name
 * @property {string|null} brand
 * @property {string|null} country_code
 * @property {string|null} display_name
 * @property {string}      price_type
 * @property {number}      price
 * @property {string|null} location_name
 */

// ---------------------------------------------------------------------------
// Filter types (service-layer input shapes)
// ---------------------------------------------------------------------------

/**
 * Filters accepted by the lot adjustment lookup.
 *
 * @typedef {Object} LotAdjustmentLookupFilters
 * @property {boolean} [includeExternal] - Whether to include external adjustment types.
 */
 