/**
 * @file pricing-type-business.js
 * @description Business logic layer for pricing type access control.
 *
 * Owns ACL evaluation and visibility rule enforcement for pricing types.
 * Contains no orchestration — service layer owns query execution and transformation.
 *
 * Base read access (VIEW_PRICING) is enforced by route-level authorize middleware.
 * This layer only resolves scope-level flags that affect filter behaviour.
 *
 * Exports:
 *  - evaluatePricingTypeVisibility    — resolves ACL flags from user permissions
 *  - applyPricingTypeVisibilityRules  — injects server-side filter constraints from ACL
 */

'use strict';

const { resolveUserPermissionContext } = require('../services/permission-service');
const PRICING_CONSTANTS                = require('../utils/constants/domain/pricing-constants');
const { logSystemException }           = require('../utils/logging/system-logger');
const AppError                         = require('../utils/AppError');

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

module.exports = {
  evaluatePricingTypeVisibility,
  applyPricingTypeVisibilityRules,
};
