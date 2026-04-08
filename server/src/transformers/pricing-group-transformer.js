/**
 * @file pricing-group-transformer.js
 * @description Pure transformer functions for pricing group records.
 */

'use strict';

/** @typedef {import('./types/pricing-group-types').PricingGroupRow} PricingGroupRow */
/** @typedef {import('./types/pricing-group-types').PricingGroupFlatRecord} PricingGroupFlatRecord */
/** @typedef {import('./types/pricing-group-types').PricingGroupDetailRow} PricingGroupDetailRow */
/** @typedef {import('./types/pricing-group-types').PricingGroupDetailRecord} PricingGroupDetailRecord */
/** @typedef {import('./types/pagination-types').PaginatedResult} PaginatedResult */

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * @param {PricingGroupRow} row
 * @returns {PricingGroupFlatRecord}
 */
const transformPricingGroupRow = (row) => cleanObject({
  id:              row.id,
  pricingTypeId:   row.pricing_type_id,
  pricingTypeName: row.pricing_type_name,
  pricingTypeCode: row.pricing_type_code,
  countryCode:     row.country_code      ?? null,
  price:           parseFloat(row.price),
  validFrom:       row.valid_from,
  validTo:         row.valid_to          ?? null,
  status:          makeStatus(row),
  skuCount:        parseInt(row.sku_count,     10),
  productCount:    parseInt(row.product_count, 10),
  updatedAt:       row.updated_at,
});

/**
 * @param {PricingGroupDetailRow} row
 * @returns {PricingGroupDetailRecord}
 */
const transformPricingGroupDetail = (row) => cleanObject({
  id:                row.id,
  pricingTypeId:     row.pricing_type_id,
  pricingTypeName:   row.pricing_type_name,
  pricingTypeCode:   row.pricing_type_code,
  countryCode:       row.country_code        ?? null,
  price:             parseFloat(row.price),
  validFrom:         row.valid_from,
  validTo:           row.valid_to            ?? null,
  status:            makeStatus(row),
  audit:             compactAudit(makeAudit(row)),
});

/**
 * @param {PaginatedResult<PricingGroupRow>} paginatedResult
 * @returns {PaginatedResult<PricingGroupFlatRecord>}
 */
const transformPricingGroupList = (paginatedResult) =>
  transformPageResult(paginatedResult, transformPricingGroupRow);

module.exports = {
  transformPricingGroupRow,
  transformPricingGroupDetail,
  transformPricingGroupList,
};
