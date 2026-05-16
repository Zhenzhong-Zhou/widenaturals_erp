/**
 * @file pricing-transformer.js
 * @description Pure transformer functions for pricing records.
 */

'use strict';

const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { makeStatus } = require('../utils/status-utils');
const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');

// ─── Pricing Join (UI / Redux) ────────────────────────────────────────────────

/**
 * @param {PricingJoinRow} row
 * @returns {PricingJoinRecord}
 */
const transformPricingJoinRow = (row) => ({
  pricingId: row.pricing_id,
  pricingGroupId: row.pricing_group_id,
  pricingTypeId: row.pricing_type_id,
  pricingTypeName: row.pricing_type_name,
  pricingTypeCode: row.pricing_type_code,
  countryCode: row.country_code ?? null,
  price: parseFloat(row.price),
  validFrom: row.valid_from,
  validTo: row.valid_to ?? null,
  status: makeStatus(row),
  skuId: row.sku_id,
  sku: row.sku,
  barcode: row.barcode,
  sizeLabel: row.size_label ?? null,
  skuCountryCode: row.sku_country_code ?? null,
  productId: row.product_id,
  productName: row.product_name,
  brand: row.brand ?? null,
  category: row.category ?? null,
  displayName: getProductDisplayName(row),
});

/**
 * @param {PaginatedResult<PricingJoinRow>} paginatedResult
 * @returns {Promise<PaginatedResult<PricingJoinRow>>}
 */
const transformPricingJoinList = (paginatedResult) =>
  transformPageResult(paginatedResult, transformPricingJoinRow);

// ─── Pricing Export (CSV / Excel) ─────────────────────────────────────────────

/**
 * @param {PricingExportRow} row
 * @returns {PricingExportRecord}
 */
const transformPricingExportRow = (row) => ({
  // Product
  productName: row.product_name,
  brand: row.brand ?? null,
  category: row.category ?? null,

  // SKU
  sku: row.sku,
  barcode: row.barcode,
  sizeLabel: row.size_label ?? null,
  skuCountryCode: row.sku_country_code ?? null,

  // Pricing Type
  pricingTypeName: row.pricing_type_name,
  pricingTypeCode: row.pricing_type_code,

  // Geography & Price
  countryCode: row.country_code ?? null,
  price: parseFloat(row.price),
  validFrom: row.valid_from,
  validTo: row.valid_to ?? null,

  // Status
  statusName: row.status_name,

  // Audit
  audit: compactAudit(makeAudit(row)),
});

/**
 * @param {PricingExportRow[]} rows
 * @returns {PricingExportRecord[]}
 */
const transformPricingExport = (rows) => rows.map(transformPricingExportRow);

/**
 * @param {PricingBySkuRow} row
 * @returns {PricingBySkuRecord}
 */
const transformPricingBySkuRow = (row) =>
  cleanObject({
    pricingId: row.pricing_id,
    skuId: row.sku_id,
    pricingGroupId: row.pricing_group_id,
    pricingTypeId: row.pricing_type_id,
    priceTypeName: row.price_type_name,
    priceTypeCode: row.price_type_code,
    countryCode: row.country_code ?? null,
    price: parseFloat(row.price),
    validFrom: row.valid_from,
    validTo: row.valid_to ?? null,
    status: makeStatus(row),
    audit: compactAudit(makeAudit(row)),
  });

/**
 * @param {PricingBySkuRow[]} rows
 * @returns {PricingBySkuRecord[]}
 */
const transformPricingBySku = (rows) => rows.map(transformPricingBySkuRow);

/**
 * Transforms a single ACL-filtered SKU pricing row into the SKU-detail
 * pricing DTO shape.
 *
 * Accepts both the slice-layer shape (nested `priceType: { id, name, code }`)
 * and an already-flat shape, falling back across the two.
 *
 * `status` and `audit` are emitted only when present on the input row. The
 * slice layer omits them when ACL denies the corresponding access, and this
 * transformer preserves that decision rather than synthesizing empty objects.
 *
 * @param {SafeSkuPricingRow} row
 * @returns {SkuDetailPricingDto}
 */
const transformSkuDetailPricingRow = (row) => {
  const out = cleanObject({
    pricingId: row.pricingId ?? row.id,
    skuId: row.skuId,
    pricingGroupId: row.pricingGroupId,
    
    pricingTypeId: row.priceType?.id ?? row.pricingTypeId ?? null,
    pricingTypeName: row.priceType?.name ?? row.pricingTypeName ?? null,
    pricingTypeCode: row.priceType?.code ?? row.pricingTypeCode ?? null,
    
    countryCode: row.countryCode ?? null,
    price: row.price != null ? parseFloat(row.price) : null,
    
    validFrom: row.validFrom ?? null,
    validTo: row.validTo ?? null,
  });
  
  if (row.status) out.status = row.status;
  if (row.audit) out.audit = row.audit;
  
  return out;
};

/**
 * Transforms an array of ACL-filtered SKU pricing rows into pricing DTOs
 * for the SKU detail response. Returns an empty array for non-array input.
 *
 * @param {SafeSkuPricingRow[]} [rows]
 * @returns {SkuDetailPricingDto[]}
 */
const transformSkuDetailPricing = (rows = []) => {
  if (!Array.isArray(rows)) return [];
  
  return rows.map(transformSkuDetailPricingRow);
};

module.exports = {
  transformPricingJoinList,
  transformPricingExport,
  transformPricingBySkuRow,
  transformPricingBySku,
  transformSkuDetailPricing,
};
