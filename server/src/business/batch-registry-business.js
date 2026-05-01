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
const { assertWarehouseAccess, enforceWarehouseScope } = require('./warehouse-inventory-business');
const { getStatusId } = require('../config/status-cache');

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
    
    const canViewAllBatchStatus =
      isRoot ||
      permissions.includes(
        BATCH_CONSTANTS.PERMISSIONS.VIEW_BATCH_STATUSES
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
      canViewAllBatchStatus,
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
    canViewAllBatchTypes: acl.canViewAllBatches,
    canViewAllBatchStatus: acl.canViewAllBatchStatus,
    canViewProductBatches: acl.canViewProductBatches,
    canViewPackagingBatches: acl.canViewPackagingBatches,
    canViewManufacturer: acl.canViewManufacturer,
    canViewSupplier: acl.canViewSupplier,
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

/**
 * Prepares the filter object for the batch registry inventory lookup.
 *
 * Two independent privilege flags relax the default restrictions:
 * - `canViewAllWarehouses` — may omit `warehouseId`, accesses batches across
 *   all warehouses, and sees batches already placed in the target warehouse
 *   (the `excludeFromWarehouseId` exclusion is dropped).
 * - `canViewAllBatchStatus` — sees batches in any status, including
 *   archived and pending. Without this, all users are constrained to
 *   released batches only.
 *
 * Standard users (neither flag) must supply `warehouseId`, which is verified
 * against their assigned warehouses, and only see released batches not yet
 * placed in the target warehouse — the inventory-insert use case.
 *
 * The request's `warehouseId` is rewritten to `excludeFromWarehouseId` so the
 * underlying query surfaces batches *not yet placed* in the target warehouse.
 * The original `warehouseId` is stripped from the returned filter to keep the
 * repository contract clean.
 *
 * @param {object}   filters                - Filters from the request.
 * @param {string}   [filters.warehouseId]  - Target warehouse for inventory placement.
 * @param {string}   [filters.batchType]    - Optional batch type filter.
 * @param {string}   [filters.keyword]      - Optional keyword search term.
 * @param {AuthUser} user                   - Authenticated user making the request.
 *
 * @returns {Promise<object>} Prepared filter object for the service layer.
 *
 * @throws {AppError} validationError if `warehouseId` is missing for a user
 *   without `canViewAllWarehouses`.
 * @throws {AppError} authorizationError if the user lacks access to the
 *   requested warehouse.
 * @throws {AppError} businessError if visibility evaluation fails.
 */
const fetchBatchRegistryForInventoryLookup = async (filters, user) => {
  const acl = await evaluateBatchRegistryVisibility(user);
  
  // ─── Validate warehouseId requirement ────────────────────────────────────
  // Privileged users may omit warehouseId entirely; standard users cannot.
  if (!filters.warehouseId && !acl.canViewAllWarehouses) {
    throw AppError.validationError(
      'warehouseId is required for inventory lookup.'
    );
  }
  
  // ─── Resolve released status ────────────────────────────────────────────
  // Synchronous cache lookup — used to constrain non-privileged users to
  // released batches only.
  const batchReleasedStatusId = getStatusId('batch_released');
  
  // ─── Enforce warehouse scope for non-privileged users ───────────────────
  // Privileged users skip the warehouse round-trip entirely. Everyone else
  // must have the requested warehouse in their assigned set, unless they
  // hold canViewAll at the warehouse-access level.
  if (!acl.canViewAllWarehouses) {
    const warehouseAccess = await assertWarehouseAccess(user);
    
    if (!warehouseAccess.canViewAll && filters.warehouseId) {
      enforceWarehouseScope(
        warehouseAccess.assignedWarehouseIds,
        filters.warehouseId
      );
    }
  }
  
  // ─── Build adjusted filter object with default restrictions ─────────────
  // Default-restrictive: every request gets warehouse-scope exclusion and
  // released-only status. Privileged users have these stripped below.
  const adjustedFilters = {
    ...filters,
    ...(filters.warehouseId && { excludeFromWarehouseId: filters.warehouseId }),
    statusIds: [batchReleasedStatusId],
  };
  
  // ─── Strip restrictions for privileged users ────────────────────────────
  // canViewAllWarehouses removes the warehouse-scope exclusion, allowing the
  // user to see batches already placed in the target warehouse. canViewAllBatchStatuses
  // removes the released-only constraint, exposing archived and pending batches.
  if (acl.canViewAllWarehouses) {
    delete adjustedFilters.excludeFromWarehouseId;
  }
  
  if (acl.canViewAllBatchStatus) {
    delete adjustedFilters.statusIds;
  }
  
  // ─── Apply batch-type visibility rules from the ACL ──────────────────────
  // Injects keywordCapabilities and may set forceEmptyResult / batchType
  // narrowing based on the user's product/packaging visibility.
  const adjusted = applyBatchRegistryVisibilityRules(adjustedFilters, acl);
  
  // warehouseId is business-layer-only — repo expects excludeFromWarehouseId.
  delete adjusted.warehouseId;
  
  return adjusted;
};

module.exports = {
  validateBatchRegistryEntryById,
  evaluateBatchRegistryVisibility,
  applyBatchRegistryVisibilityRules,
  sliceBatchRegistryRow,
  fetchBatchRegistryForInventoryLookup,
};
