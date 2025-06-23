const { checkPermissions } = require('../services/role-permission-service');

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
    base.address = customer.address;
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

module.exports = {
  filterCustomerForViewer,
};
