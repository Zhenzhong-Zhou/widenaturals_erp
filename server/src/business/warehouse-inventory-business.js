/**
 * @file warehouse-inventory-business.js
 * @description Business-layer ACL evaluation for warehouse inventory visibility.
 *
 * Two-tier access control:
 *  1. Warehouse scope — determines which warehouses the user can access.
 *     Users with `VIEW_ALL_WAREHOUSES` bypass assignment checks; others are
 *     restricted to their `assignedWarehouseIds`.
 *  2. Batch-type visibility — determines which inventory record types
 *     (product vs packaging) the user can see within accessible warehouses.
 *     Follows the same evaluate → apply pattern as batch registry ACL.
 *
 * Field-level flags (`canViewFinancials`, `canViewManufacturer`, `canViewSupplier`)
 * are resolved here but enforced by the transformer layer, not the filter builder.
 *
 * Exports:
 *  - evaluateWarehouseInventoryVisibility
 *  - applyWarehouseInventoryVisibilityRules
 */

'use strict';

const { resolveUserPermissionContext } = require('../services/permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/warehouse-inventory');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { applyBatchTypeVisibility } = require('./apply-batch-type-visibility');
const { getWarehouseIdsByUserId } = require('../repositories/user-warehouse-assignment-repository');

const CONTEXT = 'warehouse-inventory-business';

/**
 * Resolves warehouse inventory visibility capabilities for the given user.
 *
 * `canViewAllWarehouses` short-circuits warehouse scope — if true,
 * user can view inventory at any warehouse.
 *
 * Batch-type visibility flags follow the same pattern as batch registry ACL.
 *
 * @param {AuthUser} user
 * @returns {Promise<WarehouseInventoryVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateWarehouseInventoryVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateWarehouseInventoryVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    // ─── Warehouse scope ───────────────────────────────────────────────────────
    
    const canViewAllWarehouses =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_WAREHOUSES);
    
    let assignedWarehouseIds = null;
    
    if (!canViewAllWarehouses) {
      assignedWarehouseIds = await getWarehouseIdsByUserId(user.id);
    }
    
    // ─── Batch-type visibility ─────────────────────────────────────────────────
    
    const canViewAllBatchTypes =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_ALL_BATCH_TYPES);
    
    const canViewProductBatches =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_PRODUCT_INVENTORY);
    
    const canViewPackagingBatches =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_PACKAGING_INVENTORY);
    
    // ─── Field-level visibility ────────────────────────────────────────────────
    
    const canViewFinancials =
      isRoot ||
      permissions.includes(PERMISSIONS.VIEW_INVENTORY_FINANCIALS);
    
    const canViewManufacturer =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_INVENTORY_MANUFACTURER);
    
    const canViewSupplier =
      canViewAllBatchTypes ||
      permissions.includes(PERMISSIONS.VIEW_INVENTORY_SUPPLIER);
    
    return {
      // Warehouse scope
      canViewAllWarehouses,
      assignedWarehouseIds,
      
      // Batch-type visibility
      canViewAllBatchTypes,
      canViewProductBatches,
      canViewPackagingBatches,
      
      // Field-level visibility
      canViewFinancials,
      canViewManufacturer,
      canViewSupplier,
      
      // Derived search capabilities
      canSearchProduct:           canViewProductBatches,
      canSearchSku:               canViewProductBatches,
      canSearchManufacturer:      canViewManufacturer,
      canSearchPackagingMaterial: canViewPackagingBatches,
      canSearchSupplier:          canViewSupplier,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate warehouse inventory visibility', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate warehouse inventory visibility.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a warehouse inventory filter object.
 *
 * Evaluation order:
 *  1. Warehouse scope — user must have access to the requested warehouse.
 *  2. Batch-type narrowing — same logic as batch registry ACL.
 *  3. Keyword capabilities — injected for search clause scoping.
 *
 * @param {object} filters
 * @param {string} filters.warehouseId
 * @param {WarehouseInventoryVisibilityAcl} acl
 * @returns {object} Adjusted copy of filters with visibility rules applied.
 */
const applyWarehouseInventoryVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  // ─── 1. Warehouse scope ──────────────────────────────────────────────────────
  
  if (
    !acl.canViewAllWarehouses &&
    !acl.assignedWarehouseIds.includes(filters.warehouseId)
  ) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }
  
  // ─── 2. Batch-type visibility ────────────────────────────────────────────────
  
  return applyBatchTypeVisibility(adjusted, acl);
};

module.exports = {
  evaluateWarehouseInventoryVisibility,
  applyWarehouseInventoryVisibilityRules,
};
