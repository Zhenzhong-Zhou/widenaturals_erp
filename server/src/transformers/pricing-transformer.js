/**
 * @file pricing-transformer.js
 * @description Pure transformer functions for pricing records.
 */

'use strict';

/** @typedef {import('./types/pricing-types').PricingSkuRow} PricingSkuRow */
/** @typedef {import('./types/pricing-types').PricingSkuFlatRecord} PricingSkuFlatRecord */
/** @typedef {import('./types/pricing-types').PricingBySkuRow} PricingBySkuRow */
/** @typedef {import('./types/pricing-types').PricingBySkuRecord} PricingBySkuRecord */
/** @typedef {import('./types/pricing-types').PricingBatchRow} PricingBatchRow */
/** @typedef {import('./types/pagination-types').PaginatedResult} PaginatedResult */

const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { makeStatus } = require('../utils/status-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');
/**
 * @param {PricingSkuRow} row
 * @returns {PricingSkuFlatRecord}
 */
const transformPricingSkuRow = (row) => ({
  pricingId:       row.pricing_id,
  pricingGroupId:  row.pricing_group_id,
  pricingTypeId:   row.pricing_type_id,
  pricingTypeName: row.pricing_type_name,
  pricingTypeCode: row.pricing_type_code,
  countryCode:     row.country_code     ?? null,
  price:           parseFloat(row.price),
  validFrom:       row.valid_from,
  validTo:         row.valid_to         ?? null,
  status:          makeStatus(row),
  skuId:           row.sku_id,
  sku:             row.sku,
  barcode:         row.barcode,
  sizeLabel:       row.size_label       ?? null,
  skuCountryCode:  row.sku_country_code ?? null,
  productId:       row.product_id,
  productName:     row.product_name,
  brand:           row.brand            ?? null,
  category:        row.category         ?? null,
});

/**
 * @param {PricingBySkuRow} row
 * @returns {PricingBySkuRecord}
 */
const transformPricingBySkuRow = (row) => cleanObject({
  pricingId:          row.pricing_id,
  skuId:              row.sku_id,
  pricingGroupId:     row.pricing_group_id,
  pricingTypeId:      row.pricing_type_id,
  priceTypeName:      row.price_type_name,
  priceTypeCode:      row.price_type_code,
  countryCode:        row.country_code          ?? null,
  price:              parseFloat(row.price),
  validFrom:          row.valid_from,
  validTo:            row.valid_to              ?? null,
  status:             makeStatus(row),
  audit:              compactAudit(makeAudit(row)),
});

/**
 * @param {PaginatedResult<PricingSkuRow>} paginatedResult
 * @returns {PaginatedResult<PricingSkuFlatRecord>}
 */
const transformPricingSkuList = (paginatedResult) =>
  transformPageResult(paginatedResult, transformPricingSkuRow);

/**
 * @param {PricingSkuRow[]} rows
 * @returns {PricingSkuFlatRecord[]}
 */
const transformPricingExport = (rows) => rows.map(transformPricingSkuRow);

/**
 * @param {PricingBySkuRow[]} rows
 * @returns {PricingBySkuRecord[]}
 */
const transformPricingBySku = (rows) => rows.map(transformPricingBySkuRow);

module.exports = {
  transformPricingSkuRow,
  transformPricingBySkuRow,
  transformPricingSkuList,
  transformPricingExport,
  transformPricingBySku,
};
