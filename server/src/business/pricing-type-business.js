/**
 * @file pricing-type-business.js
 * @description Business logic layer for pricing type access control and
 * lookup-row decoration.
 *
 * Owns ACL evaluation, visibility rule enforcement, and active-flag
 * enrichment for pricing types — across both the management/list
 * endpoints and the lookup endpoint. Contains no orchestration; the
 * service layer owns query execution, transformation, and cache
 * resolution.
 *
 * Base read access (VIEW_PRICING / VIEW_PRICING_TYPE_LOOKUP) is enforced
 * by route-level authorize middleware. This layer only resolves
 * scope-level flags and applies the filter shaping they imply.
 *
 * Exports:
 *  - evaluatePricingTypeVisibility          — ACL for management/list endpoints
 *  - applyPricingTypeVisibilityRules        — injects scope flags into management filters
 *  - evaluatePricingTypeLookupVisibility    — ACL for the lookup endpoint
 *  - resolvePricingTypeLookupFilters        — pins active status for restricted lookup callers
 *  - enrichPricingTypeLookupWithActiveFlag  — decorates a lookup row with isActive
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const PRICING_CONSTANTS = require('../utils/constants/domain/pricing-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { enrichWithActiveFlag } = require('./lookup-visibility');

const CONTEXT = 'pricing-type-business';

/**
 * Evaluates pricing type visibility permissions for the given user.
 *
 * Base read access is enforced by route-level authorize middleware.
 * This function only resolves scope flags that affect filter behaviour.
 *
 * @param {Object} user - Authenticated user object.
 * @returns {Promise<PricingTypeAcl>}
 * @throws {AppError} businessError if permission context cannot be resolved.
 */
const evaluatePricingTypeVisibility = async (user) => {
  const context = `${CONTEXT}/evaluatePricingTypeVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewAllTypes =
      isRoot ||
      permissions.includes(PRICING_CONSTANTS.PERMISSIONS.VIEW_ALL_TYPES);

    const canManagePricingTypes =
      isRoot ||
      permissions.includes(PRICING_CONSTANTS.PERMISSIONS.MANAGE_PRICING_TYPES);

    return {
      canViewAllTypes,
      canManagePricingTypes,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate pricing type visibility', {
      context,
      userId: user?.id,
    });
    throw AppError.businessError('Unable to evaluate pricing type visibility.');
  }
};

/**
 * Applies pricing type visibility rules to the filter set.
 *
 * Base read access is already enforced by route-level authorize middleware.
 * This function only injects scope-level flags into the filter object.
 *
 * - canViewAllStatuses: false → status filter restricted to active only.
 *
 * @param {Object}         filters - Raw filter object from the controller.
 * @param {PricingTypeAcl} acl     - Resolved ACL from evaluatePricingTypeVisibility.
 * @returns {Object} Adjusted filters.
 */
const applyPricingTypeVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  // Inject status visibility flag into filter builder.
  adjusted.canViewAllStatuses = acl.canViewAllTypes;

  return adjusted;
};

/**
 * Resolves the ACL for the pricing type lookup endpoint.
 *
 * Returns scope flags consumed downstream by the lookup workflow:
 *  - `canViewInactive` — true for root or holders of VIEW_ALL_TYPES;
 *    bypasses the active-status pin in the resolver and enables the
 *    transformer to surface (and tag) inactive rows.
 *
 * Throws AppError.businessError if permission resolution fails.
 *
 * @param {Object} user - Authenticated user from req.auth.user.
 * @returns {Promise<PricingTypeLookupAcl>}
 */
const evaluatePricingTypeLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluatePricingTypeLookupVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const canViewInactive =
      isRoot ||
      permissions.includes(PRICING_CONSTANTS.PERMISSIONS.VIEW_ALL_TYPES);

    return {
      canViewInactive,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate pricing type lookup visibility',
      {
        context,
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate pricing type lookup visibility.'
    );
  }
};

/**
 * Applies pricing_types lookup ACL to caller-supplied filters.
 *
 * Pure function — no side effects on inputs. Regular callers are pinned
 * to the supplied active status id (which overrides any caller-supplied
 * value). Privileged callers (root or holders of VIEW_ALL_TYPES, exposed
 * as `canViewInactive`) bypass the pin and see all statuses.
 *
 * @param {PricingTypeFilters}   filters
 * @param {PricingTypeLookupAcl} acl
 * @param {string}               activeStatusId - Cached id for the active status (resolved by the service).
 * @returns {PricingTypeFilters}
 */
const resolvePricingTypeLookupFilters = (filters, acl, activeStatusId) =>
  acl.canViewInactive ? filters : { ...filters, statusId: activeStatusId };

/**
 * Decorates a pricing type lookup row with an `isActive` boolean derived
 * from the cached active status id.
 *
 * Thin wrapper over the shared `enrichWithActiveFlag` utility — kept as
 * a domain-named export for symmetry with the rest of the lookup
 * pipeline (resolver, transformer, enricher) and so the workflow
 * `rowEnricher` reads in domain terms.
 *
 * @param {PricingTypeLookupRow} row
 * @param {string}               activeStatusId - Cached id for the active status (resolved by the service).
 * @returns {PricingTypeLookupRow & { isActive: boolean }}
 */
const enrichPricingTypeLookupWithActiveFlag = (row, activeStatusId) =>
  enrichWithActiveFlag(row, activeStatusId);

module.exports = {
  evaluatePricingTypeVisibility,
  applyPricingTypeVisibilityRules,
  evaluatePricingTypeLookupVisibility,
  resolvePricingTypeLookupFilters,
  enrichPricingTypeLookupWithActiveFlag,
};
