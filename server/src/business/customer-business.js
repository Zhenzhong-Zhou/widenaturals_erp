const { getStatusIdByName } = require('../repositories/status-repository');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemError,
} = require('../utils/system-logger');
const {
  checkPermissions,
  resolveUserPermissionContext,
} = require('../services/role-permission-service');
const { PERMISSIONS } = require('../utils/constants/domain/customer-constants');

/**
 * Prepares customer data by validating and enriching it with default fields.
 *
 * @param {Array<Object>} customers - Array of pre-validated customer objects.
 * @param {String} createdBy - ID of the user creating the records.
 * @returns {Promise<Array<Object>>} - Enriched customer objects ready for insertion.
 *
 * @throws {AppError} - Throws database or enrichment error.
 */
const prepareCustomersForInsert = async (customers, createdBy) => {
  try {
    const activeStatusId = await getStatusIdByName('active');
    if (!activeStatusId) {
      logSystemError('Customer preparation failed: Missing active status ID');
      throw AppError.notFoundError('Active status ID not found.');
    }

    return customers.map((customer) => ({
      ...customer,
      status_id: activeStatusId,
      created_by: createdBy,
      updated_by: createdBy,
    }));
  } catch (error) {
    logSystemException(error, 'Failed to prepare customers for insert', {
      traceContext: 'prepareCustomersForInsert',
    });

    throw AppError.businessError(
      'Customer preparation failed: Validation or enrichment error.',
      error
    );
  }
};

/**
 * Filters and returns a customer object based on the viewer's role and purpose.
 *
 * - Purpose can be 'insert_response', 'detail_view', or 'admin_view'.
 * - Viewer permissions and context determine what fields are returned.
 *
 * @param {object} customer - Fully enriched customer object.
 * @param {object} user - Authenticated user object with role info.
 * @param {string} purpose - Context of the filtering, e.g., 'insert_response', 'detail_view'.
 * @returns {object} Filtered customer object.
 */
const filterCustomerForViewer = async (
  customer,
  user,
  purpose = 'detail_view'
) => {
  const canViewAudit = await checkPermissions(user, ['view_customer_audit']);
  const canViewDetails = await checkPermissions(user, ['view_customer_detail']);

  const base = {
    id: customer.id,
    firstname: customer.firstname,
    lastname: customer.lastname,
    email: customer.email,
    phoneNumber: customer.phoneNumber,
    status: { name: customer.status?.name },
  };

  if (purpose === 'insert_response') {
    // Minimal info to confirm creation
    return base;
  }

  if (canViewDetails || purpose === 'detail_view') {
    base.note = customer.note;
  }

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
 * Evaluates access control flags for customer lookup based on user permissions.
 *
 * Determines whether the current user is allowed to view:
 * - All customer statuses (`canViewAllStatuses`)
 * - Only active customers (`canViewActiveOnly`)
 *
 * This is typically used before building dropdown filters or customer queries.
 *
 * @param {object} user - The user object (must contain user ID or context for permission resolution).
 * @returns {Promise<{ canViewAllStatuses: boolean, canViewActiveOnly: boolean }>}
 *          An object representing the user's access level.
 *
 * @throws {AppError} - If permission resolution fails.
 *
 * @example
 * const access = await evaluateCustomerLookupAccessControl(currentUser);
 * if (access.canViewAllStatuses) { ... }
 */
const evaluateCustomerLookupAccessControl = async (user) => {
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewAllStatuses: isRoot || permissions.includes(PERMISSIONS.VIEW_ALL_CUSTOMERS),
      canViewActiveOnly: isRoot || permissions.includes(PERMISSIONS.VIEW_ACTIVE_CUSTOMERS),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate customer access control', {
      context: 'customer-business/evaluateCustomerLookupAccessControl',
      userId: user?.id,
    });
    
    throw AppError.businessError('Unable to evaluate access control for customer lookup', {
      details: err.message,
      stage: 'evaluate-customer-access',
    });
  }
};

/**
 * Enforces access-based visibility rules for customer lookup filters.
 *
 * Modifies the incoming filters object to restrict the data a user can see
 * based on their access level:
 * - If user cannot view all statuses, applies `statusId` to restrict results to active only.
 * - Adds `_activeStatusId` as fallback for internal filtering (e.g., in keyword search).
 *
 * This function mutates a shallow copy of the provided `filters` object and returns it.
 *
 * @param {object} [filters={}] - Initial filter object provided by the caller.
 * @param {object} userAccess - Result of `evaluateCustomerLookupAccessControl`, includes boolean flags.
 * @param {string} activeStatusId - The ID of the "active" status to enforce if restricted.
 * @returns {object} - The modified filter object with enforced visibility rules.
 *
 * @example
 * const userAccess = await evaluateCustomerLookupAccessControl(currentUser);
 * const safeFilters = enforceCustomerLookupVisibilityRules(userFilters, userAccess, ACTIVE_STATUS_ID);
 */
const enforceCustomerLookupVisibilityRules = (filters = {}, userAccess, activeStatusId) => {
  const adjusted = { ...filters };
  
  // Enforce active-only status filter for restricted users
  if (!userAccess.canViewAllStatuses) {
    adjusted.statusId ??= activeStatusId;
    adjusted._activeStatusId = activeStatusId; // used by keyword clause as fallback
  } else {
    // Clean up if elevated
    delete adjusted.statusId;
    delete adjusted._activeStatusId;
  }
  
  return adjusted;
};

/**
 * Enriches a customer database row with UI-ready flags.
 *
 * This function adds derived boolean fields:
 * - `isActive`: Whether the customer's `status_id` matches the provided active status ID.
 * - `hasAddress`: Whether the customer has an associated address (based on `has_address` field).
 *
 * These fields are useful for conditionally rendering customer options in dropdowns,
 * select lists, and other UI components.
 *
 * @param {object} row - The raw customer object from the database.
 *   Expected to contain at least:
 *     - `status_id: string`
 *     - `has_address: boolean | null`
 * @param {string} activeStatusId - The status ID representing an "active" customer.
 *
 * @throws {AppError} If the row is not a valid object or if the activeStatusId is missing or invalid.
 *
 * @returns {object} A new object containing all original customer fields plus:
 *   - `isActive: boolean`
 *   - `hasAddress: boolean`
 *
 * @example
 * const enriched = enrichCustomerOption(customerRow, ACTIVE_STATUS_ID);
 * if (enriched.isActive && enriched.hasAddress) {
 *   showCustomer(enriched);
 * }
 */
const enrichCustomerOption = (row, activeStatusId) => {
  // Validate row
  if (!row || typeof row !== 'object') {
    throw AppError.validationError('[enrichCustomerOption] Invalid `row` - expected object but got ' + typeof row);
  }
  
  // Validate activeStatusId
  if (typeof activeStatusId !== 'string' || activeStatusId.length === 0) {
    throw AppError.validationError('[enrichCustomerOption] Missing or invalid `activeStatusId`');
  }
  
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
