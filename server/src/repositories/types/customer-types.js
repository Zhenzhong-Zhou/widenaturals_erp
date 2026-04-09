/**
 * @file customer-types.js
 * @description JSDoc typedefs for the customer domain.
 *
 * Two categories of types:
 *   - Row types    – raw DB column aliases from repository queries
 *   - Record types – transformed UI-facing shapes
 *
 * Nullable fields are those sourced from LEFT JOINed tables.
 * `_by` fields are user UUIDs typed as `string|null`, not dates.
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by enriched and paginated customer queries.
 *
 * @typedef {Object} CustomerRow
 * @property {string}       id
 * @property {string}       customer_type
 * @property {string|null}  firstname
 * @property {string|null}  lastname
 * @property {string|null}  company_name
 * @property {string|null}  email
 * @property {string|null}  phone_number
 * @property {string|null}  note
 * @property {string|null}  status_id
 * @property {string|null}  status_name
 * @property {string|null}  status_date
 * @property {boolean|null} has_address
 * @property {string|null}  created_at
 * @property {string|null}  updated_at
 * @property {string|null}  created_by
 * @property {string|null}  created_by_firstname
 * @property {string|null}  created_by_lastname
 * @property {string|null}  updated_by
 * @property {string|null}  updated_by_firstname
 * @property {string|null}  updated_by_lastname
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed customer record — nested shape used for enriched/detail views.
 *
 * @typedef {Object} CustomerNestedRecord
 * @property {string}      id
 * @property {string}      customerType
 * @property {string|null} firstname
 * @property {string|null} lastname
 * @property {string|null} companyName
 * @property {string|null} email
 * @property {string|null} phoneNumber
 * @property {string|null} note
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {boolean|null} hasAddress
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 * @property {{ firstname: string|null, lastname: string|null }} createdBy
 * @property {{ firstname: string|null, lastname: string|null }} updatedBy
 */

/**
 * Transformed customer record — flat shape used for paginated table views.
 *
 * @typedef {Object} CustomerFlatRecord
 * @property {string}       id
 * @property {string}       customerType
 * @property {string|null}  customerName
 * @property {string|null}  email
 * @property {string|null}  phoneNumber
 * @property {string|null}  statusId
 * @property {string|null}  statusName
 * @property {string|null}  statusDate
 * @property {boolean|null} hasAddress
 * @property {string|null}  createdAt
 * @property {string|null}  updatedAt
 * @property {string|null}  createdBy
 * @property {string|null}  updatedBy
 */

/**
 * @typedef {Object} CustomerSummary
 * @property {string|null} type
 * @property {string|null} fullName
 * @property {string|null} companyName
 * @property {string|null} email
 * @property {string|null} phoneNumber
 */
