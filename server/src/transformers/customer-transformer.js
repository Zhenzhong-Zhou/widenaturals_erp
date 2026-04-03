/**
 * @file customer-transformer.js
 * @description Row-level and page-level transformers for customer records.
 *
 * Exports:
 *   - transformEnrichedCustomers         – transforms enriched customer rows (nested shape)
 *   - transformPaginatedCustomerResults  – transforms a paginated result set (flat shape)
 *
 * Internal helpers (not exported):
 *   - transformCustomerRow – transforms a single customer row; supports `nested` and `flat` formats
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject }  = require('../utils/object-utils');
const { getFullName }  = require('../utils/person-utils');
const {
  transformRows,
  transformPageResult,
} = require('../utils/transformer-utils');

/**
 * Transforms a single customer DB row into either a nested or flat shape.
 *
 * - `'nested'` – full structured object with sub-objects for status, createdBy, updatedBy.
 *   Used for enriched/detail views returned after insert.
 * - `'flat'`   – collapsed object with combined name fields and flat status fields.
 *   Used for paginated table views.
 *
 * @param {CustomerRow} row
 * @param {{ format?: 'nested'|'flat' }} [options]
 * @returns {CustomerNestedRecord|CustomerFlatRecord}
 */
const transformCustomerRow = (row, { format = 'nested' } = {}) => {
  const base = {
    id:          row.id          ?? null,
    firstname:   row.firstname   ?? null,
    lastname:    row.lastname    ?? null,
    email:       row.email       ?? null,
    phoneNumber: row.phone_number ?? null,
    note:        row.note        ?? null,
    status: {
      id:   row.status_id   ?? null,
      name: row.status_name ?? null,
    },
    hasAddress: row.has_address ?? null,
    createdAt:  row.created_at  ?? null,
    updatedAt:  row.updated_at  ?? null,
    createdBy: {
      firstname: row.created_by_firstname ?? null,
      lastname:  row.created_by_lastname  ?? null,
    },
    updatedBy: {
      firstname: row.updated_by_firstname ?? null,
      lastname:  row.updated_by_lastname  ?? null,
    },
  };
  
  if (format === 'flat') {
    return cleanObject({
      id:           base.id,
      customerName: getFullName(base.firstname, base.lastname),
      email:        base.email,
      phoneNumber:  base.phoneNumber,
      statusId:     base.status.id,
      statusName:   base.status.name,
      hasAddress:   base.hasAddress,
      createdAt:    base.createdAt,
      updatedAt:    base.updatedAt,
      createdBy:    getFullName(base.createdBy.firstname, base.createdBy.lastname),
      updatedBy:    getFullName(base.updatedBy.firstname, base.updatedBy.lastname),
    });
  }
  
  return cleanObject(base);
};

/**
 * Transforms an array of enriched customer rows into the nested detail shape.
 *
 * @param {CustomerRow[]} rows
 * @returns {CustomerNestedRecord[]}
 */
const transformEnrichedCustomers = (rows) =>
  transformRows(rows, (row) => transformCustomerRow(row, { format: 'nested' }));

/**
 * Transforms a paginated customer result set into the flat table view shape.
 *
 * Delegates per-row transformation to `transformCustomerRow` via `transformPageResult`,
 * which preserves pagination metadata.
 *
 * @param {Object} paginatedResult
 * @param {CustomerRow[]} paginatedResult.data
 * @param {Object} paginatedResult.pagination
 * @returns {Promise<PaginatedResult<CustomerRow>>}
 */
const transformPaginatedCustomerResults = (paginatedResult) =>
  transformPageResult(paginatedResult, (row) =>
    transformCustomerRow(row, { format: 'flat' })
  );

module.exports = {
  transformEnrichedCustomers,
  transformPaginatedCustomerResults,
};
