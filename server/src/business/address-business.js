const { checkPermissions } = require('../services/role-permission-service');
const AppError = require('../utils/AppError');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { getAddressById, assignCustomerToAddress } = require('../repositories/address-repository');

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
const filterAddressForViewer = async (address, user, purpose = 'detail_view') => {
  const canViewAudit = await checkPermissions(user, ['view_address_audit']);
  const canViewDetails = await checkPermissions(user, ['view_address_detail']);
  
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

/**
 * Validates that the given address belongs to the specified customer.
 * If the address is unassigned (customer_id is null), it will be assigned to the customer.
 *
 * This function enforces address ownership constraints required for sales order creation.
 * It also performs the mutation safely within the passed transaction client.
 *
 * @param {string} addressId - The ID of the address to validate.
 * @param {string} customerId - The ID of the customer that must own the address.
 * @param {object} client - The database transaction client (e.g., pg or Knex transaction).
 * @throws {AppError} - If address is not found or owned by another customer.
 */
const validateAndAssignAddressOwnership = async (addressId, customerId, client) => {
  try {
    const address = await getAddressById(addressId, client);
    
    if (!address) {
      throw AppError.notFoundError(`Address not found: ${addressId}`);
    }
    
    if (address.customer_id && address.customer_id !== customerId) {
      throw AppError.validationError(`Address ${addressId} does not belong to the selected customer`);
    }
    
    if (!address.customer_id) {
      await assignCustomerToAddress(addressId, customerId, client);
      logSystemInfo('Assigned orphan address to customer', {
        context: 'addressBusiness/validateAndAssignAddressOwnership',
        address_id: addressId,
        assigned_to_customer_id: customerId,
      });
    }
  } catch (error) {
    logSystemException(error, 'Failed to validate or assign address ownership', {
      context: 'addressBusiness/validateAndAssignAddressOwnership',
      address_id: addressId,
      customer_id: customerId,
    });
    throw AppError.businessError('Address ownership validation failed.');
  }
};

module.exports = {
  filterAddressForViewer,
  validateAndAssignAddressOwnership,
}
