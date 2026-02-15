const {
  getBatchRegistryById,
} = require('../repositories/batch-registry-repository');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const {
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');

/**
 * Validates that a given batch_registry ID exists and matches the specified batch type.
 *
 * - Reads a single row from `batch_registry` by ID.
 * - Ensures the type matches expected ('product' or 'packaging_material').
 * - This is a pure validation step — it does NOT lock or mutate data.
 * - Row locking is NOT required as batch registry records are expected to be immutable.
 *
 * @param {'product' | 'packaging_material'} expectedType - The expected batch type.
 * @param {string} batchRegistryId - UUID of the row in batch_registry.
 * @param {object} client - pg client/pool instance.
 *
 * @throws {AppError} If not found or mismatched type.
 */
const validateBatchRegistryEntryById = async (
  expectedType,
  batchRegistryId,
  client
) => {
  try {
    const row = await getBatchRegistryById(batchRegistryId, client);

    if (!row) {
      throw AppError.notFoundError(
        `No batch registry found with ID: ${batchRegistryId}`
      );
    }

    if (row.batch_type !== expectedType) {
      throw AppError.validationError(
        `Batch type mismatch: expected "${expectedType}", found "${row.batch_type}" for ID "${batchRegistryId}"`
      );
    }
  } catch (err) {
    logSystemException(err, 'Batch registry validation failed', {
      context: 'batch-registry-business/validateBatchRegistryEntryById',
      batchRegistryId,
      expectedType,
    });

    throw AppError.businessError('Batch validation failed', {
      details: { batchRegistryId, expectedType, error: err.message },
    });
  }
};

/**
 * Business: Determine which categories of batches the requester
 * is allowed to view in batch registry list pages and related UIs.
 *
 * This function resolves BATCH VISIBILITY AUTHORITY ONLY.
 * It does NOT inspect filters, modify data, or apply query logic.
 *
 * Visibility categories covered:
 *   ✔ Product batches
 *   ✔ Packaging material batches
 *   ✔ Manufacturer metadata
 *   ✔ Supplier metadata
 *
 * Permission semantics:
 *
 *   - VIEW_PRODUCT_BATCHES
 *       Allows viewing product-related batches.
 *
 *   - VIEW_PACKAGING_BATCHES
 *       Allows viewing packaging-material batches.
 *
 *   - VIEW_BATCH_MANUFACTURER
 *       Allows viewing manufacturer metadata.
 *
 *   - VIEW_BATCH_SUPPLIER
 *       Allows viewing supplier metadata.
 *
 *   - VIEW_BATCH_ALL_VISIBILITY
 *       FULL VISIBILITY OVERRIDE.
 *       Grants access to all batch types and related metadata.
 *
 * Root users (`isRoot === true`) implicitly bypass all batch visibility restrictions.
 *
 * NOTE:
 * This function may return DERIVED capability flags (e.g. keyword search scope),
 * but only as a direct consequence of visibility authority.
 *
 * @param {Object} user - Authenticated user context.
 *
 * @returns {Promise<{
 *   canViewProductBatches: boolean,
 *   canViewPackagingBatches: boolean,
 *   canViewManufacturer: boolean,
 *   canViewSupplier: boolean,
 *   canViewAllBatches: boolean,
 *   canSearchProduct: boolean,
 *   canSearchSku: boolean,
 *   canSearchManufacturer: boolean,
 *   canSearchPackagingMaterial: boolean,
 *   canSearchSupplier: boolean
 * }>}
 */
const evaluateBatchRegistryVisibility = async (user) => {
  const context = 'batch-registry-business/evaluateBatchRegistryVisibility';

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    // Full visibility override
    const canViewAllBatches =
      isRoot ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_ALL_VISIBILITY
      );

    const canViewProductBatches =
      canViewAllBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_PRODUCT_BATCHES);

    const canViewPackagingBatches =
      canViewAllBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_PACKAGING_BATCHES);

    const canViewManufacturer =
      canViewAllBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_MANUFACTURER);

    const canViewSupplier =
      canViewAllBatches ||
      permissions.includes(BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_SUPPLIER);

    return {
      canViewProductBatches,
      canViewPackagingBatches,
      canViewManufacturer,
      canViewSupplier,
      canViewAllBatches,

      // Derived keyword search capabilities (visibility-driven)
      canSearchProduct: canViewProductBatches,
      canSearchSku: canViewProductBatches,
      canSearchManufacturer: canViewManufacturer,
      canSearchPackagingMaterial: canViewPackagingBatches,
      canSearchSupplier: canViewSupplier,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate batch registry visibility', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate batch registry visibility.',
      { details: err.message }
    );
  }
};

/**
 * Business: applyBatchRegistryVisibilityRules
 *
 * Adjust batch registry query filters based on evaluated visibility access control.
 *
 * Responsibility:
 * - Translate batch visibility ACL decisions into repository-consumable filter intent
 * - Intersect user-requested filters with visibility constraints (never broaden scope)
 * - Enforce batch-type visibility by narrowing or rejecting invalid requests
 *
 * Enforcement model:
 * - Repository-level SQL filtering is the PRIMARY enforcement mechanism
 * - This function expresses visibility intent; it does not execute queries
 * - Row-level slicing is DEFENSIVE only and must never expand visibility
 *
 * This function MUST:
 * - Preserve user intent whenever it is permitted
 * - Restrict `batchType` when visibility is limited
 * - Fail closed (force empty result) when requested visibility exceeds permission
 * - Explicitly signal impossible visibility via `forceEmptyResult`
 *
 * This function MUST NOT:
 * - Perform row-level filtering or transformation
 * - Evaluate permissions, roles, or identity flags
 * - Broaden visibility beyond what ACL allows
 * - Apply inventory placement, pagination, or sorting logic
 *
 * @param {Object} filters - Original query filters (pre-ACL)
 * @param {Object} acl - Result from evaluateBatchRegistryVisibility()
 * @returns {Object} Adjusted filters for repository consumption
 */
const applyBatchRegistryVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  const requestedType = filters.batchType;

  const canViewProduct = acl.canViewProductBatches === true;
  const canViewPackaging = acl.canViewPackagingBatches === true;
  const canViewAll = acl.canViewAllBatches === true;

  // -------------------------------------------------------------
  // 1. Full visibility override → respect user intent entirely
  // -------------------------------------------------------------
  if (canViewAll) {
    adjusted.keywordCapabilities = {
      canSearchProduct: true,
      canSearchSku: true,
      canSearchManufacturer: true,
      canSearchPackagingMaterial: true,
      canSearchSupplier: true,
    };
    return adjusted;
  }

  // -------------------------------------------------------------
  // 2. User explicitly requested a batch type
  // -------------------------------------------------------------
  if (requestedType === 'product') {
    if (!canViewProduct) {
      adjusted.forceEmptyResult = true;
      return adjusted;
    }
  }

  if (requestedType === 'packaging_material') {
    if (!canViewPackaging) {
      adjusted.forceEmptyResult = true;
      return adjusted;
    }
  }

  // -------------------------------------------------------------
  // 3. No batchType requested → restrict to allowed scope
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 4. Inject keyword search capabilities (CRITICAL)
  // -------------------------------------------------------------
  adjusted.keywordCapabilities = {
    canSearchProduct: canViewProduct,
    canSearchSku: canViewProduct,
    canSearchManufacturer: acl.canViewManufacturer === true,
    canSearchPackagingMaterial: canViewPackaging,
    canSearchSupplier: acl.canViewSupplier === true,
  };

  return adjusted;
};

/**
 * Business: Slice a batch registry row based on visibility rules.
 *
 * Enforces WHICH categories of batches the requester is allowed to view,
 * based on access flags from evaluateBatchRegistryVisibility().
 *
 * NOTE:
 * Repository-level filtering is the PRIMARY enforcement mechanism.
 * This function exists as a DEFENSIVE, per-row safeguard only.
 *
 * It MUST:
 * - Never broaden visibility
 * - Only exclude rows that should not be visible
 *
 * @param {Object} row - Raw batch registry row from repository
 * @param {Object} access - Flags from evaluateBatchRegistryVisibility()
 * @returns {Object|null} Batch registry row or null if not visible
 */
const sliceBatchRegistryRow = (row, access) => {
  // ---------------------------------------------------------
  // 1. Full visibility override → allow everything
  // ---------------------------------------------------------
  if (access.canViewAllBatches) {
    return row;
  }

  // ---------------------------------------------------------
  // 2. Product batch visibility
  // ---------------------------------------------------------
  if (row.batch_type === 'product' && access.canViewProductBatches !== true) {
    return null;
  }

  // ---------------------------------------------------------
  // 3. Packaging material batch visibility
  // ---------------------------------------------------------
  if (
    row.batch_type === 'packaging_material' &&
    access.canViewPackagingBatches !== true
  ) {
    return null;
  }

  return row;
};

module.exports = {
  validateBatchRegistryEntryById,
  evaluateBatchRegistryVisibility,
  applyBatchRegistryVisibilityRules,
  sliceBatchRegistryRow,
};
