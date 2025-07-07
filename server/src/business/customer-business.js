const { getStatusIdByName } = require('../repositories/status-repository');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemError
} = require('../utils/system-logger');
const { checkPermissions } = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');

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
      traceContext: 'prepareCustomersForInsert'
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
const filterCustomerForViewer = (customer, user, purpose = 'detail_view') => {
  const canViewAudit = checkPermissions(user, ['view_customer_audit']);
  const canViewDetails = checkPermissions(user, ['view_customer_detail']);
  
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
 * Determines status and visibility flags for customer queries based on user permissions.
 *
 * This function checks whether the user has permissions to view all customers or only active customers,
 * and builds query options accordingly. If the user has no applicable permissions,
 * it will either fall back to active customers or throw a forbidden error (based on your implementation).
 *
 * @param {Object} user - Authenticated user object.
 * @returns {Promise<{ statusId?: string, overrideDefaultStatus: boolean }>}
 *   A promise resolving to query options:
 *   - `statusId`: Status UUID to filter customers by, if applicable.
 *   - `overrideDefaultStatus`: Whether to override the default status filter (for users with view_all permissions).
 *
 * @throws {AppError} If the user lacks permission to view any customers (if strict mode is enforced).
 */
const resolveCustomerQueryOptions = async (user) => {
  if (await checkPermissions(user, ['view_all_customers'])) {
    return { statusId: undefined, overrideDefaultStatus: true };
  }
  
  if (await checkPermissions(user, ['view_active_customers'])) {
    return {
      statusId: getStatusId('customer_active'),
      overrideDefaultStatus: false,
    };
  }
  
  // Default to active if no permission (legacy behavior)
  return {
    statusId: getStatusId('customer_active'),
    overrideDefaultStatus: false,
  };
};

module.exports = {
  prepareCustomersForInsert,
  filterCustomerForViewer,
  resolveCustomerQueryOptions,
};
