/**
 * @file customer-business.js
 * @description Domain business logic for customer record preparation, access
 * control evaluation, visibility rule application, field filtering, and
 * lookup row enrichment.
 */

'use strict';

const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/logging/system-logger');
const {
  checkPermissions,
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/customer-constants');

const CONTEXT = 'customer-business';

/**
 * Enriches a list of raw customer objects with status and audit fields
 * required for insert, using a pre-resolved active status ID.
 *
 * The caller is responsible for resolving `activeStatusId` before calling
 * this function — it must not be null or undefined.
 *
 * @param {object[]} customers - Raw customer objects to prepare.
 * @param {string} createdBy - UUID of the user performing the insert.
 * @param {string} activeStatusId - Pre-resolved active status UUID.
 * @returns {object[]} Enriched customer objects ready for bulk insert.
 */
const prepareCustomersForInsert = (customers, createdBy, activeStatusId) => {
  return customers.map((customer) => ({
    ...customer,
    status_id: activeStatusId,
    created_by: createdBy,
    updated_by: createdBy,
  }));
};

/**
 * Filters a transformed customer object to only the fields the requesting
 * user is permitted to see, shaped by the rendering purpose.
 *
 * - `insert_response`: returns base fields only — minimal confirmation of creation.
 * - `detail_view`: always includes `note` regardless of explicit permission,
 *   since detail views are gated upstream by route-level auth.
 * - `admin_view`: always includes audit fields regardless of explicit permission.
 *
 * @param {object} customer - Transformed customer record.
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {'detail_view' | 'insert_response' | 'admin_view'} [purpose='detail_view']
 * @returns {Promise<object>} Filtered customer object safe to return to the client.
 */
const filterCustomerForViewer = async (
  customer,
  user,
  purpose = 'detail_view'
) => {
  const [canViewAudit, canViewDetails] = await Promise.all([
    checkPermissions(user, ['view_customer_audit']),
    checkPermissions(user, ['view_customer_detail']),
  ]);

  const base = {
    id: customer.id,
    firstname: customer.firstname,
    lastname: customer.lastname,
    email: customer.email,
    phoneNumber: customer.phoneNumber,
    status: { name: customer.status?.name },
  };

  // insert_response returns base fields only — minimal creation confirmation.
  if (purpose === 'insert_response') {
    return base;
  }

  // detail_view routes are already access-gated, so note is always safe there.
  if (canViewDetails || purpose === 'detail_view') {
    base.note = customer.note;
  }

  // admin_view routes are already access-gated, so audit fields are always
  // safe there.
  if (canViewAudit || purpose === 'admin_view') {
    base.createdBy = customer.createdBy;
    base.updatedBy = customer.updatedBy;
    base.createdAt = customer.createdAt;
    base.updatedAt = customer.updatedAt;
    base.status = customer.status;
  }

  return base;
};

/**
 * Resolves which customer lookup visibility capabilities the requesting
 * user holds.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @returns {Promise<CustomerLookupAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateCustomerLookupAccessControl = async (user) => {
  const context = `${CONTEXT}/evaluateCustomerLookupAccessControl`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    return {
      canViewAllStatuses:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_CUSTOMERS),
      canViewActiveOnly:
        isRoot || permissions.includes(PERMISSIONS.VIEW_ACTIVE_CUSTOMERS),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate customer access control', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate access control for customer lookup.'
    );
  }
};

/**
 * Applies ACL-driven visibility rules to a customer lookup filter object.
 *
 * Restricted users are pinned to active-only results via `statusId` and
 * `_activeStatusId`. Elevated users have those constraints removed.
 *
 * @param {object} [filters={}] - Base filter object from the request.
 * @param {CustomerLookupAcl} userAccess - Resolved ACL from `evaluateCustomerLookupAccessControl`.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object} Adjusted copy of `filters` with visibility rules applied.
 */
const enforceCustomerLookupVisibilityRules = (
  filters = {},
  userAccess,
  activeStatusId
) => {
  const adjusted = { ...filters };

  if (!userAccess.canViewAllStatuses) {
    // Pin to active-only — _activeStatusId is used by the keyword clause as fallback.
    adjusted.statusId ??= activeStatusId;
    adjusted._activeStatusId = activeStatusId;
  } else {
    delete adjusted.statusId;
    delete adjusted._activeStatusId;
  }

  return adjusted;
};

/**
 * Enriches a customer lookup row with derived boolean flags.
 *
 * @param {object} row - Raw customer lookup row from the repository.
 * @param {string} activeStatusId - UUID of the active status record.
 * @returns {object & { isActive: boolean, hasAddress: boolean }}
 */
const enrichCustomerOption = (row, activeStatusId) => {
  return {
    ...row,
    isActive: row.status_id === activeStatusId,
    hasAddress: row.has_address === true,
  };
};

module.exports = {
  prepareCustomersForInsert,
  filterCustomerForViewer,
  evaluateCustomerLookupAccessControl,
  enforceCustomerLookupVisibilityRules,
  enrichCustomerOption,
};
