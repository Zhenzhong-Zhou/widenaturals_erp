/**
 * @file pricing-type-transformer.js
 * @description Row-level and page-level transformers for pricing type records.
 *
 * Exports:
 *   - transformPaginatedPricingTypeResult  – transforms a paginated pricing type result set
 *   - transformPricingTypeMetadata         – transforms a single pricing type detail row
 *
 * Internal helpers (not exported):
 *   - transformPricingTypeRow – per-row transformer for paginated list
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getFullName }         = require('../utils/person-utils');
const { makeStatus }          = require('../utils/status-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * Transforms a single paginated pricing type DB row into the UI-facing shape.
 *
 * @param {PricingTypeRow} row
 * @returns {PricingTypeRecord}
 */
const transformPricingTypeRow = (row) => ({
  id:                row.id,
  name:              row.name,
  code:              row.code,
  slug:              row.slug        ?? null,
  description:       row.description ?? null,
  status:            row.status,
  statusDate:        row.status_date  ? new Date(row.status_date).toISOString()  : null,
  createdAt:         row.created_at   ? new Date(row.created_at).toISOString()   : null,
  updatedAt:         row.updated_at   ? new Date(row.updated_at).toISOString()   : null,
  createdByFullName: row.created_by_fullname ?? null,
  updatedByFullName: row.updated_by_fullname ?? null,
});

/**
 * Transforms a paginated pricing type result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformPricingTypeRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}          pageResult
 * @param {PricingTypeRow[]} pageResult.data
 * @param {Object}          pageResult.pagination
 * @returns {Promise<PaginatedResult<PricingTypeRow>>}
 */
const transformPaginatedPricingTypeResult = (pageResult) =>
  /** @type {Promise<PaginatedResult<PricingTypeRow>>} */
  (transformPageResult(pageResult, transformPricingTypeRow));

/**
 * Transforms a single pricing type detail DB row into the metadata response shape.
 *
 * @param {PricingTypeDetailRow} row
 * @returns {PricingTypeDetailRecord}
 */
const transformPricingTypeMetadata = (row) => ({
  id:          row.pricing_type_id,
  name:        row.pricing_type_name,
  code:        row.pricing_type_code,
  slug:        row.pricing_type_slug        ?? null,
  description: row.pricing_type_description ?? null,
  
  status: makeStatus(row, {
    id:   'status_id',
    name: 'status_name',
    date: 'status_date',
  }),
  
  createdBy: {
    id:       row.created_by_id ?? null,
    fullName: getFullName(row.created_by_firstname, row.created_by_lastname),
  },
  updatedBy: {
    id:       row.updated_by_id ?? null,
    fullName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
  },
  
  createdAt: row.pricing_type_created_at ?? null,
  updatedAt: row.pricing_type_updated_at ?? null,
});

module.exports = {
  transformPaginatedPricingTypeResult,
  transformPricingTypeMetadata,
};
