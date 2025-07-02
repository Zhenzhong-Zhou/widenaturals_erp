const { getStatusIdByName } = require('../repositories/status-repository');
const { validateCustomer } = require('../validators/customer-validator');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemError
} = require('../utils/system-logger');
const { checkPermissions } = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');

/**
 * Prepares customer data by validating and enriching it with default fields.
 * @param {Array} customers - Array of customer objects.
 * @param {String} createdBy - ID of the user creating the records.
 * @returns {Promise<Array>} - Validated and transformed customers.
 * @throws {AppError} - Throws validation or database error.
 */
const prepareCustomersForInsert = async (customers, createdBy) => {
  try {
    if (!Array.isArray(customers) || customers.length === 0) {
      logSystemError('Customer preparation failed: Empty array received');
      throw AppError.validationError('Customer list is empty.');
    }
    
    const activeStatusId = await getStatusIdByName('active');
    if (!activeStatusId) {
      logSystemError('Customer preparation failed: Missing active status ID');
      throw AppError.notFoundError('Active status ID not found.');
    }
    
    await Promise.all(customers.map(validateCustomer));
    
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
 * @param {Object} user - Authenticated user object
 * @returns {{
 *   statusId?: string,
 *   overrideDefaultStatus: boolean,
 * }}
 */
const resolveCustomerQueryOptions = (user) => {
  const canViewAll = checkPermissions(user, 'view_all_customers');
  
  return {
    statusId: canViewAll ? undefined : getStatusId('customer_active'),
    overrideDefaultStatus: canViewAll,
  };
};

module.exports = {
  prepareCustomersForInsert,
  filterCustomerForViewer,
  resolveCustomerQueryOptions,
};
