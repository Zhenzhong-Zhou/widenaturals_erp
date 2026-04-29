/**
 * @file address-business.js
 * @description Domain business logic for address ownership validation and
 * permission-based field filtering. Intended to be called by address services,
 * not directly by controllers.
 */

'use strict';

const { checkPermissions } = require('../services/permission-service');
const AppError = require('../utils/AppError');
const { logSystemInfo } = require('../utils/logging/system-logger');
const {
  getAddressById,
  assignCustomerToAddress,
} = require('../repositories/address-repository');

const CONTEXT = 'address-business';

/**
 * @typedef {'detail_view' | 'insert_response' | 'admin_view'} AddressViewPurpose
 */

/**
 * Filters an address object to only the fields the requesting user is
 * permitted to see, shaped by the rendering purpose.
 *
 * - `insert_response`: omits full address lines (used after create/update
 *   mutations where the caller only needs confirmation fields).
 * - `detail_view`: always includes `note` regardless of explicit permission,
 *   since detail views are gated upstream by route-level auth.
 * - `admin_view`: always includes audit fields regardless of explicit
 *   permission, for the same reason.
 *
 * @param {AddressDetailRecord} address - Raw address row from the repository.
 * @param {UserRow} user - Authenticated user making the request.
 * @param {AddressViewPurpose} [purpose='detail_view'] - Rendering context.
 * @returns {Promise<object>} Filtered address object safe to return to the client.
 */
const filterAddressForViewer = async (
  address,
  user,
  purpose = 'detail_view'
) => {
  const [canViewAudit, canViewDetails] = await Promise.all([
    checkPermissions(user, ['view_address_audit']),
    checkPermissions(user, ['view_address_detail']),
  ]);

  const base = {
    id: address.id,
    customerId: address.customerId,
    recipientName: address.recipientName,
    phone: address.phone,
    email: address.email,
    label: address.label,
    displayAddress: address.displayAddress,
    customer: {
      type: address.customer?.type ?? null,
      fullName: address.customer?.fullName ?? null,
      companyName: address.customer?.companyName ?? null,
      email: address.customer?.email ?? null,
      phoneNumber: address.customer?.phoneNumber ?? null,
    },
  };

  // Full address lines are omitted from insert responses — the caller only
  // needs confirmation fields after a create/update operation.
  if (purpose !== 'insert_response') {
    base.addressLine1 = address.addressLine1;
    base.addressLine2 = address.addressLine2;
    base.city = address.city;
    base.state = address.state;
    base.postalCode = address.postalCode;
    base.country = address.country;
    base.region = address.region;
  }

  // detail_view routes are already access-gated, so note is always safe there.
  if (canViewDetails || purpose === 'detail_view') {
    base.note = address.note;
  }

  // admin_view routes are already access-gated, so audit fields are always
  // safe there.
  if (canViewAudit || purpose === 'admin_view') {
    base.createdBy = address.createdBy;
    base.updatedBy = address.updatedBy;
    base.createdAt = address.createdAt;
    base.updatedAt = address.updatedAt;
  }

  return base;
};

/**
 * Validates that an address is eligible to be used by the given customer,
 * and assigns ownership if the address is currently unowned (orphan).
 *
 * Throws a `notFoundError` if the address does not exist.
 * Throws a `validationError` if the address is already owned by a different customer.
 * Unexpected database errors are allowed to propagate for the global error handler.
 *
 * @param {string} addressId - UUID of the address to validate.
 * @param {string} customerId - UUID of the customer claiming the address.
 * @param {import('pg').PoolClient} client - Active transaction client.
 * @returns {Promise<void>}
 * @throws {AppError} notFoundError | validationError
 */
const validateAndAssignAddressOwnership = async (
  addressId,
  customerId,
  client
) => {
  const context = `${CONTEXT}/validateAndAssignAddressOwnership`;

  const address = await getAddressById(addressId, client);

  if (!address) {
    throw AppError.notFoundError(`Address not found: ${addressId}`);
  }

  if (address.customer_id && address.customer_id !== customerId) {
    throw AppError.validationError(
      `Address ${addressId} does not belong to the selected customer`
    );
  }

  if (!address.customer_id) {
    await assignCustomerToAddress(addressId, customerId, client);
    logSystemInfo('Assigned orphan address to customer', {
      context,
      address_id: addressId,
      assigned_to_customer_id: customerId,
    });
  }
};

module.exports = {
  filterAddressForViewer,
  validateAndAssignAddressOwnership,
};
