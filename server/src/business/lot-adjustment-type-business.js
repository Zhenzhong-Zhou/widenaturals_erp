/**
 * @file lot-adjustment-type-business.js
 * @description Business logic layer for lot adjustment type lookup access
 * control and lookup-row decoration.
 *
 * Owns ACL evaluation, visibility rule enforcement, and active-flag
 * normalisation for the lot adjustment type lookup endpoint. Contains
 * no orchestration; the service layer owns query execution,
 * transformation, and filter resolution.
 *
 * Base read access is enforced by route-level authorize middleware. This
 * layer only resolves scope-level flags and applies the filter shaping
 * they imply.
 *
 * Exports:
 *  - evaluateLotAdjustmentTypeLookupVisibility - ACL for the lookup endpoint
 *  - resolveLotAdjustmentTypeLookupFilters     - pins active flag and excludes
 *                                                internal names for restricted callers
 *  - enrichLotAdjustmentTypeLookupRow          - decorates a lookup row with isActive
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  LOT_ADJUSTMENT_TYPE_CONSTANTS,
} = require('../utils/constants/domain/lot-adjustment-type-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  INVENTORY_ACTION_TYPE_CONSTANTS,
} = require('../utils/constants/domain/inventory-action-type-constants');

const CONTEXT = 'lot-adjustment-type-business';

/**
 * Resolves the ACL for the lot adjustment type lookup endpoint.
 *
 * Returns two scope flags consumed downstream by the lookup workflow:
 *  - `canViewInactive` — true for root or holders of VIEW_ALL_STATUSES;
 *    bypasses the `isActive: true` pin in the resolver and enables the
 *    transformer to surface (and tag) inactive rows.
 *  - `canViewInternal` — true for root or holders of VIEW_INTERNAL;
 *    bypasses the `excludeNames` pin and surfaces internal stock
 *    management types.
 *
 * The two flags are independent — admins can hold one without the other.
 *
 * Throws AppError.businessError if permission resolution fails.
 *
 * @param {Object} user - Authenticated user from req.auth.user.
 * @returns {Promise<LotAdjustmentTypeLookupAcl>}
 */
const evaluateLotAdjustmentTypeLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateLotAdjustmentTypeLookupVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewInactive:
        isRoot ||
        permissions.includes(
          LOT_ADJUSTMENT_TYPE_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES
        ),
      canViewInternal:
        isRoot ||
        permissions.includes(
          LOT_ADJUSTMENT_TYPE_CONSTANTS.PERMISSIONS.VIEW_INTERNAL
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate lot adjustment type lookup visibility',
      { context, userId: user?.id }
    );
    throw AppError.businessError(
      'Unable to evaluate lot adjustment type lookup visibility.'
    );
  }
};

/**
 * Applies lot adjustment type lookup ACL to caller-supplied filters.
 *
 * Pure function — no side effects on inputs.
 *
 * Three pins:
 *
 *  1. Category scope (unconditional) — `actionTypeCategories` is always
 *     pinned to [CATEGORIES.ADJUSTMENT], overriding any caller-supplied
 *     value regardless of privilege. This is the semantic boundary of
 *     the lookup; the endpoint exists to surface lot adjustment types
 *     tied to adjustment-category parent actions, and no caller has a
 *     reason to broaden it here.
 *
 *  2. Active-status pin (ACL-gated) — without `canViewInactive`,
 *     `isActive` is forced to `true`, overriding any caller-supplied
 *     value. Holders of VIEW_ALL_STATUSES skip the pin and retain
 *     whatever they passed.
 *
 *  3. Internal-exclusion pin (ACL-gated) — without `canViewInternal`,
 *     `excludeNames` is pinned to the reserved internal type names list,
 *     hiding stock-management types (e.g. manual_stock_insert,
 *     manual_stock_update). Holders of VIEW_INTERNAL skip the pin and
 *     see all types within the adjustment category.
 *
 * @param {LotAdjustmentTypeFilters}   filters
 * @param {LotAdjustmentTypeLookupAcl} acl
 * @returns {LotAdjustmentTypeFilters}
 */
const resolveLotAdjustmentTypeLookupFilters = (filters, acl) => {
  const next = { ...filters };

  // ─── Category scope (always pinned) ───────────────────────────────────────
  next.actionTypeCategories = [
    INVENTORY_ACTION_TYPE_CONSTANTS.CATEGORIES.ADJUSTMENT,
  ];

  // ─── Active-status pin ────────────────────────────────────────────────────
  if (!acl.canViewInactive) next.isActive = true;

  // ─── Internal-exclusion pin ───────────────────────────────────────────────
  if (!acl.canViewInternal) {
    next.excludeNames = LOT_ADJUSTMENT_TYPE_CONSTANTS.INTERNAL_TYPE_NAMES;
  }

  return next;
};

/**
 * Decorates a lot adjustment type lookup row with a normalised
 * `isActive` boolean flag (passthrough of the boolean `is_active`
 * column with explicit casting).
 *
 * @param {LotAdjustmentTypeRow} row
 * @returns {LotAdjustmentTypeRow & { isActive: boolean }}
 */
const enrichLotAdjustmentTypeLookupRow = (row) => ({
  ...row,
  isActive: Boolean(row.is_active),
});

module.exports = {
  evaluateLotAdjustmentTypeLookupVisibility,
  resolveLotAdjustmentTypeLookupFilters,
  enrichLotAdjustmentTypeLookupRow,
};
