'use strict';

/**
 * Applies batch-type visibility narrowing and keyword capability injection
 * to an adjusted filter object.
 *
 * Shared by batch registry and warehouse inventory ACL rules.
 *
 * @param {object} adjusted          - Mutable copy of the request filters.
 * @param {object} acl
 * @param {boolean} acl.canViewAllBatchTypes
 * @param {boolean} acl.canViewProductBatches
 * @param {boolean} acl.canViewPackagingBatches
 * @param {boolean} acl.canViewManufacturer
 * @param {boolean} acl.canViewSupplier
 * @returns {object} The adjusted filters (may have forceEmptyResult set).
 */
const applyBatchTypeVisibility = (adjusted, acl) => {
  const requestedType = adjusted.batchType;
  const canViewProduct = acl.canViewProductBatches === true;
  const canViewPackaging = acl.canViewPackagingBatches === true;

  // ─── Full batch-type visibility ──────────────────────────────────────────

  if (acl.canViewAllBatchTypes) {
    adjusted.keywordCapabilities = {
      canSearchProduct: true,
      canSearchSku: true,
      canSearchManufacturer: true,
      canSearchPackagingMaterial: true,
      canSearchSupplier: true,
    };
    return adjusted;
  }

  // ─── Explicit type requested but user lacks permission ───────────────────

  if (requestedType === 'product' && !canViewProduct) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }

  if (requestedType === 'packaging_material' && !canViewPackaging) {
    adjusted.forceEmptyResult = true;
    return adjusted;
  }

  // ─── No type requested → narrow to allowed scope ─────────────────────────

  if (!requestedType) {
    if (canViewProduct && !canViewPackaging) {
      adjusted.batchType = 'product';
    } else if (!canViewProduct && canViewPackaging) {
      adjusted.batchType = 'packaging_material';
    } else if (!canViewProduct && !canViewPackaging) {
      adjusted.forceEmptyResult = true;
      return adjusted;
    }
  }

  // ─── Keyword capabilities ────────────────────────────────────────────────

  adjusted.keywordCapabilities = {
    canSearchProduct: canViewProduct,
    canSearchSku: canViewProduct,
    canSearchManufacturer: acl.canViewManufacturer === true,
    canSearchPackagingMaterial: canViewPackaging,
    canSearchSupplier: acl.canViewSupplier === true,
  };

  return adjusted;
};

module.exports = {
  applyBatchTypeVisibility,
};
