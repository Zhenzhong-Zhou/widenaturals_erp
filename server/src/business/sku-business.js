/**
 * @file sku-business.js
 * @description Domain business logic for SKU access control evaluation,
 * visibility rule application, creation validation, insert payload preparation,
 * status transition validation, row enrichment, and edit policy enforcement.
 */

'use strict';

const AppError = require('../utils/AppError');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { getStatusId, getStatusNameById } = require('../config/status-cache');
const { logSystemException } = require('../utils/logging/system-logger');
const {
  SKU_CONSTANTS,
  BARCODE_REGEX,
  SKU_EDIT_POLICIES,
} = require('../utils/constants/domain/sku-constants');
const { getGenericIssueReason } = require('../utils/enrich-utils');
const {
  skuHasInventory,
} = require('../repositories/warehouse-inventory-repository');
const { skuHasActiveOrders } = require('../repositories/order-item-repository');
const {
  skuHasActiveAllocations,
} = require('../repositories/inventory-allocations-repository');
const {
  skuHasActiveTransfers,
} = require('../repositories/transfer-order-item-repository');
const { skuHasAnyHistory } = require('../repositories/sku-repository');
const {
  getSkuOperationalStatusIds,
} = require('../config/sku-operational-status-cache');
const { resolveImageUrl } = require('../utils/aws-s3-service');

const CONTEXT = 'sku-business';

/** Required fields for SKU creation. */
const SKU_REQUIRED_FIELDS = Object.freeze([
  'product_id',
  'brand_code',
  'category_code',
  'variant_code',
  'region_code',
]);

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Checks whether a SKU status transition is permitted.
 *
 * Returns `false` if either status ID cannot be resolved to a known code.
 *
 * @param {string} currentStatusId
 * @param {string} newStatusId
 * @returns {boolean}
 */
const validateSkuStatusTransition = (currentStatusId, newStatusId) => {
  const allowedTransitions = {
    DRAFT: ['ACTIVE', 'INACTIVE'],
    ACTIVE: ['INACTIVE', 'DISCONTINUED'],
    INACTIVE: ['ACTIVE'],
    DISCONTINUED: ['ARCHIVED'],
    ARCHIVED: [],
  };

  const currentCode = getStatusNameById(currentStatusId);
  const nextCode = getStatusNameById(newStatusId);

  if (!currentCode || !nextCode) return false;

  return (allowedTransitions[currentCode] ?? []).includes(nextCode);
};

/**
 * Checks whether a SKU has any active operational dependencies (inventory,
 * orders, allocations, or transfers).
 *
 * @param {string} skuId
 * @param {string[]} activeOrderStatusIds
 * @param {string[]} activeAllocationStatusIds
 * @param {string[]} activeTransferStatusIds
 * @param {import('pg').PoolClient | null} [client=null]
 * @returns {Promise<boolean>}
 */
const skuHasActiveDependencies = async (
  skuId,
  activeOrderStatusIds,
  activeAllocationStatusIds,
  activeTransferStatusIds,
  client = null
) => {
  if (await skuHasInventory(skuId, client)) return true;
  if (await skuHasActiveOrders(skuId, activeOrderStatusIds, client))
    return true;
  if (await skuHasActiveAllocations(skuId, activeAllocationStatusIds, client))
    return true;
  return await skuHasActiveTransfers(skuId, activeTransferStatusIds, client);
};

// ---------------------------------------------------------------------------
// Exported business functions
// ---------------------------------------------------------------------------

/**
 * Resolves which SKU lookup filter capabilities the requesting user holds.
 *
 * `allowAllSkus` grants access to inactive, backordered, and internal SKUs.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<SkuFilterAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateSkuFilterAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateSkuFilterAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      allowAllSkus:
        isRoot ||
        permissions.includes(SKU_CONSTANTS.ADMIN_OVERRIDE_SKU_FILTERS) ||
        permissions.includes(SKU_CONSTANTS.ALLOW_INTERNAL_ORDER_SKUS) ||
        permissions.includes(SKU_CONSTANTS.ALLOW_BACKORDER_SKUS),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU filter access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate SKU filter access control.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a SKU lookup options object.
 *
 * Restricted users are required to have available stock in warehouse inventory.
 * Unrestricted users (allowAllSkus) receive the options unchanged.
 *
 * @param {object}      [options={}]    - Base options object from the request.
 * @param {SkuFilterAcl} [userAccess={}] - Resolved ACL from evaluateSkuFilterAccessControl.
 * @returns {object} Adjusted options with visibility rules applied.
 */
const enforceSkuLookupVisibilityRules = (options = {}, userAccess = {}) => {
  const adjusted = {
    ...options,
    allowAllSkus: !!userAccess.allowAllSkus,
  };

  if (!userAccess.allowAllSkus) {
    adjusted.requireAvailableStock = true;
  }

  return adjusted;
};

/**
 * Applies ACL-driven access filters to a SKU lookup filter object.
 *
 * Restricted users are pinned to active SKU and product statuses and
 * required to have available warehouse inventory stock.
 * Unrestricted users (allowAllSkus) receive the filters unchanged.
 *
 * @param {object}       [filters={}]    - Base filter object from the request.
 * @param {SkuFilterAcl} [userAccess={}] - Resolved ACL from evaluateSkuFilterAccessControl.
 * @param {string}       activeStatusId  - UUID of the active status record.
 * @returns {object} Adjusted copy of filters with access rules applied.
 */
const filterSkuLookupQuery = (
  filters = {},
  userAccess = {},
  activeStatusId
) => {
  const modified = { ...filters };

  if (!userAccess.allowAllSkus) {
    modified.sku_status_id = activeStatusId;
    modified.product_status_id = activeStatusId;
    modified.requireAvailableStock = true;
  }

  return modified;
};

/**
 * Enriches a SKU row with a derived `isNormal` flag and optional `issueReasons`.
 *
 * `isNormal` is true when all present status fields match their expected values.
 * `issueReasons` is only included when `isNormal` is false.
 *
 * @param {object} row - Raw SKU row from the repository.
 * @param {{ sku: string, product: string, warehouse: string, location: string, batch: string }} expectedStatusIds
 * @returns {object}
 */
const enrichSkuRow = (row, expectedStatusIds) => {
  const {
    sku_status_id,
    product_status_id,
    warehouse_status_id,
    location_status_id,
    batch_status_id,
  } = row;

  const noStatusFields =
    sku_status_id == null &&
    product_status_id == null &&
    warehouse_status_id == null &&
    location_status_id == null &&
    batch_status_id == null;

  if (noStatusFields) {
    return { ...row, isNormal: true };
  }

  const statusChecks = {
    skuStatusValid: sku_status_id === expectedStatusIds.sku,
    productStatusValid: product_status_id === expectedStatusIds.product,
    warehouseInventoryValid:
      !warehouse_status_id ||
      warehouse_status_id === expectedStatusIds.warehouse,
    locationInventoryValid:
      !location_status_id || location_status_id === expectedStatusIds.location,
    batchStatusValid:
      !batch_status_id || batch_status_id === expectedStatusIds.batch,
  };

  const isNormal = Object.values(statusChecks).every(Boolean);

  return {
    ...row,
    isNormal,
    ...(isNormal
      ? {}
      : {
          issueReasons: Object.entries(statusChecks)
            .filter(([, valid]) => !valid)
            .map(([key]) => getGenericIssueReason(key)),
        }),
  };
};

/**
 * Validates a single SKU creation payload for required fields and barcode format.
 *
 * @param {object} skuData - SKU creation payload.
 * @returns {void}
 * @throws {AppError} validationError if required fields are missing or barcode is invalid.
 */
const validateSkuCreation = (skuData) => {
  for (const field of SKU_REQUIRED_FIELDS) {
    if (!skuData[field]) {
      throw AppError.validationError(`Missing required field: ${field}`);
    }
  }

  if (skuData.barcode && !BARCODE_REGEX.test(skuData.barcode)) {
    throw AppError.validationError(
      `Invalid barcode format: ${skuData.barcode}`
    );
  }
};

/**
 * Validates a list of SKU creation payloads.
 *
 * @param {object[]} skuList - Array of SKU creation payloads.
 * @returns {void}
 * @throws {AppError} validationError if the list is empty or any entry is invalid.
 */
const validateSkuList = (skuList) => {
  if (!Array.isArray(skuList) || skuList.length === 0) {
    throw AppError.validationError(
      `SKU list is empty or invalid. Expected fields: ${SKU_REQUIRED_FIELDS.join(', ')}`
    );
  }

  for (const sku of skuList) {
    validateSkuCreation(sku);
  }
};

/**
 * Prepares SKU insert payloads from validated SKU creation data.
 *
 * Maps each validated SKU input to a database-ready row, using the generated
 * SKU code at the same index. Optional fields are normalized to null, and
 * language defaults to `en-fr` when not provided.
 *
 * Assumes `skuList` and `generatedSkus` are index-aligned and have already
 * been validated by the caller.
 *
 * @param {object[]} skuList - Validated SKU creation payloads.
 * @param {string[]} generatedSkus - Generated SKU codes, index-matched to `skuList`.
 * @param {string} statusId - UUID of the initial SKU status.
 * @param {string} userId - UUID of the user creating the SKUs.
 * @returns {object[]} Database-ready SKU insert rows.
 */
const prepareSkuInsertPayloads = (skuList, generatedSkus, statusId, userId) =>
  skuList.map((s, i) => ({
    product_id: s.product_id,
    sku: generatedSkus[i],
    barcode: s.barcode ?? null,
    language: s.language ?? 'en-fr',
    country_code: s.region_code ?? null,
    market_region: s.market_region ?? null,
    size_label: s.size_label ?? null,
    description: s.description ?? null,
    length_cm: s.length_cm ?? null,
    width_cm: s.width_cm ?? null,
    height_cm: s.height_cm ?? null,
    weight_g: s.weight_g ?? null,
    status_id: statusId,
    created_by: userId,
  }));

/**
 * Asserts that a SKU status transition is permitted, throwing if not.
 *
 * @param {string} currentStatusId - UUID of the current status.
 * @param {string} newStatusId - UUID of the target status.
 * @returns {void}
 * @throws {AppError} validationError if either status ID is unknown or the
 *   transition is not permitted.
 */
const assertValidSkuStatusTransition = (currentStatusId, newStatusId) => {
  const current = getStatusNameById(currentStatusId);
  const next = getStatusNameById(newStatusId);

  if (!current || !next) {
    throw AppError.validationError('Unknown SKU status ID(s).', {
      currentStatusId,
      newStatusId,
    });
  }

  if (!validateSkuStatusTransition(currentStatusId, newStatusId)) {
    throw AppError.validationError(
      `Invalid SKU status transition: ${current} → ${next}`,
      { currentStatusId, newStatusId }
    );
  }
};

/**
 * Resolves which SKU status visibility capabilities the requesting user holds.
 *
 * `canViewAllSkuStatuses` is a full override — it implies inactive SKU and
 * product visibility.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<SkuStatusAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateSkuStatusAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateSkuStatusAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewInactiveSku:
        isRoot ||
        permissions.includes(SKU_CONSTANTS.PERMISSIONS.VIEW_SKU_INACTIVE),
      canViewInactiveProduct:
        isRoot ||
        permissions.includes(SKU_CONSTANTS.PERMISSIONS.VIEW_PRODUCT_INACTIVE),
      canViewAllSkuStatuses:
        isRoot ||
        permissions.includes(SKU_CONSTANTS.PERMISSIONS.VIEW_SKUS_ALL_STATUSES),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate SKU status access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate SKU status access control.'
    );
  }
};

/**
 * Filters a single SKU row based on the user's status visibility access.
 * Returns `null` if the row should not be visible to the user.
 *
 * @param {object} skuRow - Raw SKU row from the repository.
 * @param {SkuStatusAcl} access - Resolved ACL from `evaluateSkuStatusAccessControl`.
 * @returns {object | null}
 */
const sliceSkuForUser = (skuRow, access) => {
  if (access.canViewAllSkuStatuses) return skuRow;

  const ACTIVE_SKU_STATUS_ID = getStatusId('general_active');
  const ACTIVE_PRODUCT_STATUS_ID = getStatusId('product_active');

  const isSkuActive = skuRow.sku_status_id === ACTIVE_SKU_STATUS_ID;
  const isProductActive = skuRow.product_status_id === ACTIVE_PRODUCT_STATUS_ID;

  if (!isSkuActive && !access.canViewInactiveSku) return null;
  if (!isProductActive && !access.canViewInactiveProduct) return null;

  return skuRow;
};

/**
 * Applies ACL-driven visibility rules to a SKU product card filter object.
 *
 * Full override removes all status restrictions. Otherwise SKU and product
 * status filters are set based on the user's visibility flags.
 *
 * @param {object} filters - Base filter object from the request.
 * @param {SkuStatusAcl} acl - Resolved ACL from `evaluateSkuStatusAccessControl`.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const applySkuProductCardVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  if (acl.canViewAllSkuStatuses) {
    delete adjusted.skuStatusIds;
    delete adjusted.productStatusIds;
    return adjusted;
  }

  const ACTIVE_SKU_STATUS_ID = getStatusId('general_active');
  const ACTIVE_PRODUCT_STATUS_ID = getStatusId('product_active');

  if (!acl.canViewInactiveSku) {
    adjusted.skuStatusIds = [ACTIVE_SKU_STATUS_ID];
  } else {
    delete adjusted.skuStatusIds;
  }

  if (!acl.canViewInactiveProduct) {
    adjusted.productStatusIds = [ACTIVE_PRODUCT_STATUS_ID];
  } else {
    delete adjusted.productStatusIds;
  }

  return adjusted;
};

/**
 * Resolves the nested `image.url` field on each item in any paginated
 * SKU result. Works with both card and list row shapes since they share
 * the `image: { url, alt }` substructure.
 *
 * @template T
 * @param {PaginatedResult<T>} paginated
 * @returns {Promise<PaginatedResult<T>>}
 */
const resolveSkuImageUrls = async (paginated) => {
  if (!paginated) return paginated;
  
  const arrayField = Array.isArray(paginated.items)
    ? 'items'
    : Array.isArray(paginated.data)
      ? 'data'
      : null;
  
  if (!arrayField || paginated[arrayField].length === 0) return paginated;
  
  const resolved = await Promise.all(
    paginated[arrayField].map(async (item) => ({
      ...item,
      image: item.image
        ? { ...item.image, url: await resolveImageUrl(item.image.url) }
        : null,
    }))
  );
  
  return { ...paginated, [arrayField]: resolved };
};

/**
 * Resolves the flat `primaryImageUrl` field on each item in a paginated
 * SKU list result. Use this for endpoints whose row shape exposes the
 * image URL as a top-level field instead of a nested object.
 *
 * @template T
 * @param {PaginatedResult<T>} paginated
 * @returns {Promise<PaginatedResult<T>>}
 */
const resolveSkuPrimaryImageUrls = async (paginated) => {
  if (!paginated) return paginated;
  
  const arrayField = Array.isArray(paginated.items)
    ? 'items'
    : Array.isArray(paginated.data)
      ? 'data'
      : null;
  
  if (!arrayField || paginated[arrayField].length === 0) return paginated;
  
  const resolved = await Promise.all(
    paginated[arrayField].map(async (item) => ({
      ...item,
      primaryImageUrl: await resolveImageUrl(item.primaryImageUrl),
    }))
  );
  
  return { ...paginated, [arrayField]: resolved };
};

/**
 * Asserts that a SKU is permitted to be edited under the given edit policy.
 *
 * Root users bypass all edit guards. Non-root users are checked against the
 * policy's archived, operational, and commercial history restrictions.
 *
 * @param {object} sku - Current SKU record with `id` and `status_id`.
 * @param {string} editType - Edit policy key from `SKU_EDIT_POLICIES`.
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {import('pg').PoolClient | null} client - Optional transaction client.
 * @returns {Promise<void>}
 * @throws {AppError} businessError if the edit is not permitted.
 */
const assertSkuEditAllowed = async (sku, editType, user, client) => {
  const { isRoot } = await resolveUserPermissionContext(user);

  if (isRoot) return;

  const policy = SKU_EDIT_POLICIES[editType];

  if (!policy) {
    throw AppError.businessError(`Unknown SKU edit type: ${editType}`);
  }

  const ARCHIVED_STATUS_ID = getStatusId('general_archived');

  if (policy.blockArchived && sku.status_id === ARCHIVED_STATUS_ID) {
    throw AppError.businessError('Archived SKU cannot be modified.');
  }

  if (policy.blockOperational) {
    const { order, allocation, transfer } = getSkuOperationalStatusIds();

    const hasOperational = await skuHasActiveDependencies(
      sku.id,
      order,
      allocation,
      transfer,
      client
    );

    if (hasOperational) {
      throw AppError.businessError('SKU has active operational dependencies.');
    }
  }

  if (policy.blockCommercial) {
    const hasCommercial = await skuHasAnyHistory(sku.id, client);

    if (hasCommercial) {
      throw AppError.businessError(
        'SKU has commercial history and cannot be modified.'
      );
    }
  }
};

module.exports = {
  evaluateSkuFilterAccessControl,
  enforceSkuLookupVisibilityRules,
  filterSkuLookupQuery,
  enrichSkuRow,
  validateSkuCreation,
  validateSkuList,
  prepareSkuInsertPayloads,
  assertValidSkuStatusTransition,
  evaluateSkuStatusAccessControl,
  sliceSkuForUser,
  applySkuProductCardVisibilityRules,
  resolveSkuImageUrls,
  resolveSkuPrimaryImageUrls,
  assertSkuEditAllowed,
};
