const { checkPermissions } = require('../services/role-permission-service');

/**
 * Filters and formats an address record for the viewer based on permissions and purpose.
 *
 * - Returns a minimal view for insert responses.
 * - Returns detailed address components for detail/admin views.
 * - Includes audit info if permissions or purpose allow.
 *
 * @param {Object} address - The transformed address record.
 * @param {Object} user - The user requesting the data (used for permission checks).
 * @param {string} [purpose='detail_view'] - The purpose of the response ('insert_response', 'detail_view', 'admin_view').
 * @returns {Object} The filtered address object suitable for the viewer.
 */
const filterAddressForViewer = (address, user, purpose = 'detail_view') => {
  const canViewAudit = checkPermissions(user, ['view_address_audit']);
  const canViewDetails = checkPermissions(user, ['view_address_detail']);
  
  const base = {
    id: address.id,
    customerId: address.customerId,
    recipientName: address.recipientName,
    phone: address.phone,
    email: address.email,
    label: address.label,
    displayAddress: address.displayAddress,
    customer: {
      fullName: address.customer?.fullName ?? null,
      email: address.customer?.email ?? null,
      phoneNumber: address.customer?.phoneNumber ?? null,
    },
  };
  
  if (purpose !== 'insert_response') {
    // Include full fields only if not insert response
    base.addressLine1 = address.addressLine1;
    base.addressLine2 = address.addressLine2;
    base.city = address.city;
    base.state = address.state;
    base.postalCode = address.postalCode;
    base.country = address.country;
    base.region = address.region;
  }
  
  if (canViewDetails || purpose === 'detail_view') {
    base.note = address.note;
  }
  
  if (canViewAudit || purpose === 'admin_view') {
    base.createdBy = address.createdBy;
    base.updatedBy = address.updatedBy;
    base.createdAt = address.createdAt;
    base.updatedAt = address.updatedAt;
  }
  
  return base;
};

module.exports = {
  filterAddressForViewer,
}
