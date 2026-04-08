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

const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { makeStatus } = require('../utils/status-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/** @typedef {import('./types/pricing-type-types').PricingTypeRow} PricingTypeRow */
/** @typedef {import('./types/pricing-type-types').PricingTypeFlatRecord} PricingTypeFlatRecord */
/** @typedef {import('./types/pagination-types').PaginatedResult} PaginatedResult */

/**
 * @param {PricingTypeRow} row
 * @returns {PricingTypeFlatRecord}
 */
const transformPricingTypeRow = (row) => cleanObject({
  id:                  row.id,
  name:                row.name,
  code:                row.code,
  slug:                row.slug          ?? null,
  description:         row.description   ?? null,
  status:              makeStatus(row),
  audit:               compactAudit(makeAudit(row)),
});

/**
 * @param {PaginatedResult<PricingTypeRow>} paginatedResult
 * @returns {PaginatedResult<PricingTypeFlatRecord>}
 */
const transformPricingTypeList = (paginatedResult) =>
  transformPageResult(paginatedResult, transformPricingTypeRow);

module.exports = {
  transformPricingTypeRow,
  transformPricingTypeList,
};
