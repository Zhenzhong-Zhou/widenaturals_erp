/**
 * @file warehouse-inventory-types.js
 * @description Type definitions for warehouse inventory domain.
 */

'use strict';

/**
 * @typedef {object} WarehouseInventoryVisibilityAcl
 *
 * @property {boolean}       canViewAllWarehouses       - Full warehouse scope; bypasses assignment check.
 * @property {string[]|null} assignedWarehouseIds       - Warehouse UUIDs the user is assigned to; null when unrestricted.
 *
 * @property {boolean}       canViewAllBatchTypes       - Full batch-type visibility; short-circuits product/packaging checks.
 * @property {boolean}       canViewProductBatches      - Can view product batch inventory records.
 * @property {boolean}       canViewPackagingBatches    - Can view packaging batch inventory records.
 *
 * @property {boolean}       canViewFinancials          - Can view warehouse_fee and cost-related fields.
 * @property {boolean}       canViewManufacturer        - Can view manufacturer details on product batches.
 * @property {boolean}       canViewSupplier            - Can view supplier details on packaging batches.
 *
 * @property {boolean}       canSearchProduct           - Keyword search includes product name.
 * @property {boolean}       canSearchSku               - Keyword search includes SKU code.
 * @property {boolean}       canSearchManufacturer      - Keyword search includes manufacturer name.
 * @property {boolean}       canSearchPackagingMaterial  - Keyword search includes packaging material code/name.
 * @property {boolean}       canSearchSupplier          - Keyword search includes supplier name.
 */

/**
 * @typedef {Object} WarehouseAccessResult
 * @property {string[]|null} assignedWarehouseIds
 * @property {boolean} canViewAll
 * @property {boolean} canAdjustReserved
 */
