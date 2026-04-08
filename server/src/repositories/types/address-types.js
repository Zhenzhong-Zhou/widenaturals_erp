/**
 * @file address-types.js
 * @description JSDoc typedef definitions for address-repository.js.
 *
 * Centralizes row shapes returned by address queries so they can be
 * referenced across the repository layer without duplication.
 */

'use strict';

/**
 * @typedef {Object} AddressRow
 * @property {string}      id
 * @property {string}      customer_id
 * @property {string}      recipient_name
 * @property {string}      phone
 * @property {string}      email
 * @property {string}      label
 * @property {string}      address_line1
 * @property {string|null} address_line2
 * @property {string}      city
 * @property {string}      state
 * @property {string}      postal_code
 * @property {string}      country
 * @property {string|null} region
 * @property {string|null} note
 * @property {Date}        created_at
 * @property {Date|null}   updated_at
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 * @property {string|null} customer_firstname
 * @property {string|null} customer_lastname
 * @property {string|null} customer_email
 * @property {string|null} customer_phone_number
 */

/**
 * @typedef {Object} AddressLookupRow
 * @property {string}      id
 * @property {string}      recipient_name
 * @property {string|null} label
 * @property {string}      address_line1
 * @property {string}      city
 * @property {string}      state
 * @property {string}      postal_code
 * @property {string}      country
 */

/**
 * @typedef {object} AddressDetailRecord
 * @property {string} id
 * @property {string | null} customerId
 * @property {string | null} recipientName
 * @property {string | null} phone
 * @property {string | null} email
 * @property {string | null} label
 * @property {string | null} displayAddress
 * @property {string | null} addressLine1
 * @property {string | null} addressLine2
 * @property {string | null} city
 * @property {string | null} state
 * @property {string | null} postalCode
 * @property {string | null} country
 * @property {string | null} region
 * @property {string | null} note
 * @property {string | null} createdBy
 * @property {string | null} updatedBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {{ fullName: string | null, email: string | null, phoneNumber: string | null } | null} customer
 */
