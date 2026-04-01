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
