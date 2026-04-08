/**
 * @file product-business.js
 * @description Domain business logic for product status transition validation,
 * field update filtering, insert payload preparation, access control evaluation,
 * visibility rule application, and lookup row enrichment.
 */

'use strict';

const { getStatusNameById, getStatusId } = require('../config/status-cache');
const AppError = require('../utils/AppError');
const { PERMISSIONS } = require('../utils/constants/domain/product-constants');
const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { logSystemException } = require('../utils/logging/system-logger');
const { enforceActiveOnlyVisibilityRules, enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'product-business';

/**
 * Checks whether a product status transition is permitted.
 *
 * Returns `false` if either status ID cannot be resolved to a known code.
 *
 * @param {string} currentStatusId - UUID of the current status.
 * @param {string} newStatusId - UUID of the target status.
 * @returns {boolean}
 */
const validateProductStatusTransition = (currentStatusId, newStatusId) => {
  const allowedTransitions = {
    PENDING:      ['ACTIVE', 'INACTIVE'],
    ACTIVE:       ['INACTIVE', 'DISCONTINUED', 'ARCHIVED'],
    INACTIVE:     ['ACTIVE'],
    DISCONTINUED: ['ARCHIVED'],
    ARCHIVED:     [],
  };
  
  const currentCode = getStatusNameById(currentStatusId);
  const nextCode    = getStatusNameById(newStatusId);
  
  if (!currentCode || !nextCode) return false;
  
  return (allowedTransitions[currentCode] ?? []).includes(nextCode);
};

/**
 * Asserts that a product status transition is permitted, throwing if not.
 *
 * @param {string} currentStatusId - UUID of the current status.
 * @param {string} newStatusId - UUID of the target status.
 * @returns {void}
 * @throws {AppError} validationError if either status ID is unknown or the
 *   transition is not permitted.
 */
const assertValidProductStatusTransition = (currentStatusId, newStatusId) => {
  const current = getStatusNameById(currentStatusId);
  const next    = getStatusNameById(newStatusId);
  
  if (!current || !next) {
    throw AppError.validationError('Unknown status ID(s).', {
      currentStatusId,
      newStatusId,
    });
  }
  
  if (!validateProductStatusTransition(currentStatusId, newStatusId)) {
    throw AppError.validationError(`Invalid transition: ${current} → ${next}`);
  }
};

/**
 * Filters a product update payload to only permitted fields.
 *
 * Throws if the payload contains forbidden fields (e.g. `status_id`,
 * `created_by`) or if no valid editable fields remain after filtering.
 *
 * @param {object} [updates={}] - Raw update payload from the caller.
 * @returns {object} Filtered update payload containing only permitted fields.
 * @throws {AppError} validationError if the payload is invalid, contains
 *   forbidden fields, or has no valid editable fields.
 */
const filterUpdatableProductFields = (updates = {}) => {
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    throw AppError.validationError('Invalid product update payload.');
  }
  
  const allowedFields = [
    'name', 'series', 'brand', 'category',
    'description', 'updated_by', 'updated_at',
  ];
  
  const forbiddenFields = ['status_id', 'status', 'created_by', 'created_at'];
  
  for (const key of Object.keys(updates)) {
    if (forbiddenFields.includes(key)) {
      throw AppError.validationError(
        `Field "${key}" cannot be modified through this operation. ` +
        'Use the appropriate workflow (e.g., status update service).'
      );
    }
  }
  
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowedFields.includes(key))
  );
  
  if (Object.keys(filtered).length === 0) {
    throw AppError.validationError(
      'No valid editable product fields provided for update.'
    );
  }
  
  return filtered;
};

/**
 * Validates a list of product objects before bulk insert.
 *
 * @param {object[]} products - Array of product objects to validate.
 * @returns {void}
 * @throws {AppError} validationError if the list is empty or any product is
 *   missing required fields.
 */
const validateProductList = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    throw AppError.validationError('No products provided for creation.');
  }
  
  for (const p of products) {
    if (!p.name || !p.brand || !p.category) {
      throw AppError.validationError(
        'Each product must include name, brand, and category.'
      );
    }
  }
};

/**
 * Prepares product objects for bulk insert by normalising fields and
 * assigning the inactive status and audit fields.
 *
 * New products are created with `general_inactive` status — activation
 * requires a separate status transition workflow.
 *
 * @param {object[]} products - Validated product objects.
 * @param {string} userId - UUID of the user performing the insert.
 * @returns {object[]} Insert-ready product payloads.
 */
const prepareProductInsertPayloads = (products, userId) => {
  const inactiveStatusId = getStatusId('general_inactive');
  
  return products.map((p) => ({
    name:        p.name.trim(),
    series:      p.series?.trim() ?? null,
    brand:       p.brand.trim().toUpperCase(),
    category:    p.category.trim().toUpperCase(),
    description: p.description ?? null,
    status_id:   inactiveStatusId,
    created_by:  userId,
    updated_by:  null, // remains NULL on insert per repository convention
  }));
};

/**
 * Resolves which product lookup visibility capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<ProductLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateProductLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateProductLookupAccessControl`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PRODUCTS),
      canViewActiveOnly:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ACTIVE_PRODUCTS),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate product access control', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate access control for product lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a product lookup filter object.
 *
 * Restricted users are pinned to the active status via `status_id` and
 * `_activeStatusId`. Elevated users have those constraints removed.
 *
 * @param {object} [filters={}] - Base filter object from the request.
 * @param {ProductLookupAcl} userAccess - Resolved ACL from `evaluateProductLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceProductLookupVisibilityRules = (
  filters = {},
  userAccess,
  activeStatusId
) => enforceActiveOnlyVisibilityRules(filters, userAccess, activeStatusId);

/**
 * Enriches a product lookup row with a derived `isActive` boolean flag.
 *
 * @param {object} row - Raw product row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean }}
 */
const enrichProductOption = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

module.exports = {
  assertValidProductStatusTransition,
  filterUpdatableProductFields,
  validateProductList,
  prepareProductInsertPayloads,
  evaluateProductLookupAccessControl,
  enforceProductLookupVisibilityRules,
  enrichProductOption,
};
