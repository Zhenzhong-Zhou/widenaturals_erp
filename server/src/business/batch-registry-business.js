/**
 * @file batch-registry-business.js
 * @description Domain business logic for batch registry validation, permission
 * evaluation, filter visibility rules, and row-level access slicing.
 */

'use strict';

const {
  getBatchRegistryById,
} = require('../repositories/batch-registry-repository');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/logging/system-logger');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  BATCH_CONSTANTS,
} = require('../utils/constants/domain/batch-constants');
const { applyBatchTypeVisibility } = require('./apply-batch-type-visibility');

const CONTEXT = 'batch-registry-business';

/**
 * Validates that a batch registry entry exists and matches the expected batch type.
 *
 * Throws a `notFoundError` if no entry is found for the given ID.
 * Throws a `validationError` if the entry's batch type does not match `expectedType`.
 * Unexpected database errors propagate from the repository via `handleDbError`.
 *
 * @param {string} expectedType - The batch type the entry must have (e.g. `'product'`).
 * @param {string} batchRegistryId - UUID of the batch registry entry to validate.
 * @param {import('pg').PoolClient} client - Active transaction client.
 * @returns {Promise<void>}
 * @throws {AppError} notFoundError | validationError
 */
const validateBatchRegistryEntryById = async (
  expectedType,
  batchRegistryId,
  client
) => {
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
};

/**
 * Resolves which batch registry visibility capabilities the given user holds,
 * based on their permissions and root status.
 *
 * `canViewAllBatches` short-circuits all other flags — if true, all scoped
 * view and search capabilities are also true.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<BatchRegistryVisibilityAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateBatchRegistryVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateBatchRegistryVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
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
      canViewAllBatches,
      canViewProductBatches,
      canViewPackagingBatches,
      canViewManufacturer,
      canViewSupplier,
      // Derived keyword search capabilities — driven entirely by visibility flags.
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
      'Unable to evaluate batch registry visibility.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a batch registry filter object.
 *
 * Mutually exclusive outcomes:
 * - Full visibility (`canViewAllBatches`): all keyword capabilities enabled,
 *   requested `batchType` left intact.
 * - Explicit `batchType` requested but user lacks permission: `forceEmptyResult`
 *   set to short-circuit the query.
 * - No `batchType` requested: `batchType` narrowed to the user's allowed scope,
 *   or `forceEmptyResult` if the user has no batch visibility at all.
 * - Keyword capabilities always injected into the adjusted filters.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {BatchRegistryVisibilityAcl} acl - Resolved ACL from `evaluateBatchRegistryVisibility`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applyBatchRegistryVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  return applyBatchTypeVisibility(adjusted, {
    canViewAllBatchTypes:    acl.canViewAllBatches,
    canViewProductBatches:   acl.canViewProductBatches,
    canViewPackagingBatches: acl.canViewPackagingBatches,
    canViewManufacturer:     acl.canViewManufacturer,
    canViewSupplier:         acl.canViewSupplier,
  });
};

/**
 * Filters a single batch registry row based on the user's visibility access.
 * Returns `null` if the user is not permitted to see the row's batch type.
 *
 * @param {BatchRegistryRow} row - Raw batch registry row from the repository.
 * @param {BatchRegistryVisibilityAcl} access - Resolved ACL from `evaluateBatchRegistryVisibility`.
 * @returns {BatchRegistryRow | null}
 */
const sliceBatchRegistryRow = (row, access) => {
  // Full visibility override → allow everything.
  if (access.canViewAllBatches) {
    return row;
  }
  
  if (row.batch_type === 'product' && access.canViewProductBatches !== true) {
    return null;
  }
  
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
