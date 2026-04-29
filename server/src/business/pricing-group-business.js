/**
 * @file pricing-group-business.js
 * @description Business logic layer for pricing group access control.
 *
 * Owns ACL evaluation and visibility rule enforcement for pricing groups.
 * Contains no orchestration — service layer owns query execution and transformation.
 *
 * Exports:
 *  - evaluatePricingGroupVisibility         — resolves ACL flags from user permissions
 *  - applyPricingGroupVisibilityRules       — injects server-side filter constraints from ACL
 *  - evaluatePricingGroupLookupVisibility   — resolves ACL flags for dropdown/lookup context
 *  - applyPricingGroupLookupVisibilityRules — injects lookup-scoped filter constraints from ACL
 *  - buildPricingGroupLookupQueryFilters    — applies validity window and status filters for lookup
 *  - enrichPricingGroupRow                  — derives isActive and isValidToday flags from a row
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/pricing-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'pricing-group-buiness';

/**
 * Evaluates pricing group visibility permissions for the given user.
 *
 * @param {Object} user - Authenticated user object.
 * @returns {Promise<PricingGroupAcl>}
 * @throws {AppError} businessError if permission context cannot be resolved.
 */
const evaluatePricingGroupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluatePricingGroupVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllPricingStates =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PRICING_STATES);

    const canViewAllValidPricing =
      isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING);

    const canViewInactive =
      isRoot || permissions.includes(PERMISSIONS.VIEW_INACTIVE);

    const canManagePricingGroups =
      isRoot || permissions.includes(PERMISSIONS.MANAGE_PRICING_GROUPS);

    const canAssignSkus =
      canManagePricingGroups ||
      permissions.includes(PERMISSIONS.ASSIGN_PRICING_SKUS);

    return {
      canViewAllPricingStates,
      canViewAllValidPricing,
      canViewInactive,
      canManagePricingGroups,
      canAssignSkus,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate pricing group visibility', {
      context,
      userId: user?.id,
    });
    throw AppError.businessError(
      'Unable to evaluate pricing group visibility.'
    );
  }
};

/**
 * Applies pricing group visibility rules to the filter set.
 *
 * Base read access is enforced by route-level authorize middleware.
 * This function injects server-side filter constraints based on ACL scope.
 *
 * - canViewAllPricingStates: false → restrict to active status only
 * - canViewAllValidPricing:  false → restrict to currently valid groups
 * - canViewHistory:          false → exclude expired groups
 *
 * @param {Object}          filters - Raw filter object from the controller.
 * @param {PricingGroupAcl} acl     - Resolved ACL from evaluatePricingGroupVisibility.
 * @returns {Object} Adjusted filters.
 */
const applyPricingGroupVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  // Restrict to currently valid pricing unless user can view all valid states.
  if (!acl.canViewAllValidPricing) {
    adjusted.currentlyValid = true;
  }

  // Restrict to active status unless user can view inactive groups.
  if (!acl.canViewInactive && !acl.canViewAllPricingStates) {
    adjusted._restrictKeywordToValidOnly = true;
  }

  return adjusted;
};

/**
 * Resolves which pricing group lookup visibility capabilities the requesting user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<PricingGroupLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluatePricingGroupLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluatePricingGroupLookupVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewAllPricingStates:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_PRICING_STATES),
      canViewAllValidPricing:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_VALID_PRICING),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate pricing group lookup visibility',
      { context, userId: user?.id }
    );
    throw AppError.businessError(
      'Unable to evaluate user access control for pricing group lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a pricing group lookup filter object.
 *
 * Restricted users are pinned to the active status. Keyword searches are
 * restricted to currently valid pricing groups only for unpermitted users.
 *
 * @param {Object}                 filters        - Base filter object from the request.
 * @param {PricingGroupLookupAcl}  acl            - Resolved ACL from evaluatePricingGroupLookupVisibility.
 * @param {string}                 activeStatusId - UUID of the active status record.
 * @returns {Object} Adjusted copy of filters with visibility rules applied.
 */
const applyPricingGroupLookupVisibilityRules = (
  filters,
  acl,
  activeStatusId
) => {
  const adjusted = { ...filters };

  // Restrict keyword searches to currently valid pricing for unpermitted users.
  if (filters.keyword?.trim().length > 0 && !acl.canViewAllValidPricing) {
    adjusted._restrictKeywordToValidOnly = true;
  }

  // Pin to active status for users without full status visibility.
  if (!acl.canViewAllPricingStates && activeStatusId) {
    adjusted.statusId = activeStatusId;
  }

  return adjusted;
};

/**
 * Applies validity window and status filters to a pricing group lookup query.
 *
 * Restricted users are limited to currently valid pricing groups
 * (valid_from <= now AND valid_to >= now OR NULL).
 *
 * @param {Object}                filters        - Raw filter object from the request.
 * @param {PricingGroupLookupAcl} acl            - Resolved ACL from evaluatePricingGroupLookupVisibility.
 * @param {string}                activeStatusId - UUID of the active status record.
 * @returns {Object} Adjusted copy of filters with access filters applied.
 */
const buildPricingGroupLookupQueryFilters = (filters, acl, activeStatusId) => {
  const adjusted = { ...filters };
  const now = new Date().toISOString();

  // Pin to active status for users without full status visibility.
  if (!acl.canViewAllPricingStates && activeStatusId) {
    adjusted.statusId = activeStatusId;
  }

  // Restrict to currently valid pricing groups for unpermitted users.
  if (!acl.canViewAllValidPricing) {
    adjusted.currentlyValid = true;
    adjusted.validOn = now;
  }

  return adjusted;
};

/**
 * Enriches a pricing group lookup row with derived boolean flags.
 *
 * @param {Object} row           - Raw pricing group row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {Object & { isActive: boolean, isValidToday: boolean }}
 */
const enrichPricingGroupRow = (row, activeStatusId) => {
  const now = new Date();

  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    isValidToday:
      row.valid_from <= now && (!row.valid_to || row.valid_to >= now),
  };
};

module.exports = {
  evaluatePricingGroupVisibility,
  applyPricingGroupVisibilityRules,
  evaluatePricingGroupLookupVisibility,
  applyPricingGroupLookupVisibilityRules,
  buildPricingGroupLookupQueryFilters,
  enrichPricingGroupRow,
};
