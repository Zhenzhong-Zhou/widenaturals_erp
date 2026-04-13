/**
 * @file pricing-group-transformer.js
 * @description Pure transformer functions for pricing group records.
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * @param {PricingGroupRow} row
 * @returns {PricingGroupRecord}
 */
const transformPricingGroupRow = (row) => ({
  id:                row.id,
  pricingTypeId:     row.pricing_type_id,
  pricingTypeName:   row.pricing_type_name,
  pricingTypeCode:   row.pricing_type_code,
  countryCode:       row.country_code       ?? null,
  price:             parseFloat(row.price),
  validFrom:         row.valid_from,
  validTo:           row.valid_to           ?? null,
  status:            makeStatus(row),
  skuCount:          parseInt(row.sku_count, 10),
  productCount:      parseInt(row.product_count, 10),
  audit:             compactAudit(makeAudit(row)),
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
 * @returns {Promise<PaginatedResult<PricingGroupRow>>}
 */
const transformPricingGroupList = (paginatedResult) =>
  transformPageResult(paginatedResult, transformPricingGroupRow);

module.exports = {
  transformPricingGroupRow,
  transformPricingGroupDetail,
  transformPricingGroupList,
};
