/**
 * @file batch-registry-types.js
 * @description JSDoc type definitions for the batch registry business domain.
 */

'use strict';

// ---------------------------------------------------------------------------
// Access control types (internal ACL shapes, never returned to client)
// ---------------------------------------------------------------------------

/**
 * @typedef {object} BatchRegistryVisibilityAcl
 * @property {boolean} canViewAllBatches
 * @property {boolean} canViewProductBatches
 * @property {boolean} canViewPackagingBatches
 * @property {boolean} canViewManufacturer
 * @property {boolean} canViewSupplier
 * @property {boolean} canSearchProduct
 * @property {boolean} canSearchSku
 * @property {boolean} canSearchManufacturer
 * @property {boolean} canSearchPackagingMaterial
 * @property {boolean} canSearchSupplier
 */
