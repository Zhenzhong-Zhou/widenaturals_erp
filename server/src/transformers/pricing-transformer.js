/**
 * @file pricing-transformer.js
 * @description Row-level and page-level transformers for pricing records.
 *
 * Exports:
 *   - transformPaginatedPricingResult        – paginated pricing list
 *   - transformExportPricingData             – flat export-friendly format
 *   - transformPaginatedPricingDetailResult  – paginated pricing detail by type
 *   - transformSkuPricing                    – single SKU pricing DTO
 *
 * Internal helpers (not exported):
 *   - transformPricingListRecord  – per-row transformer for paginated list
 *   - transformPricingDetailRow   – per-row transformer for pricing detail
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName }           = require('../utils/person-utils');
const { transformPageResult }   = require('../utils/transformer-utils');

/**
 * Transforms a single paginated pricing list DB row into the UI-facing shape.
 *
 * @param {PricingListRow} row
 * @returns {PricingListRecord}
 */
const transformPricingListRecord = (row) => ({
  pricingId: row.pricing_id,
  price:     row.price !== null ? Number(row.price) : null,
  validFrom: row.valid_from ?? null,
  validTo:   row.valid_to   ?? null,
  
  pricingType: {
    id:   row.pricing_type_id,
    name: row.pricing_type,
    code: row.pricing_type_code,
    slug: row.pricing_type_slug,
  },
  
  sku: {
    id:          row.sku_id,
    value:       row.sku,
    countryCode: row.country_code,
    sizeLabel:   row.size_label,
    barcode:     row.barcode ?? null,
  },
  
  product: {
    id:    row.product_id,
    name:  getProductDisplayName(row),
    brand: row.brand,
  },
});

/**
 * Transforms a paginated pricing result set into the list view shape.
 *
 * @param {Object}           paginatedResult
 * @param {PricingListRow[]} paginatedResult.data
 * @param {Object}           paginatedResult.pagination
 * @returns {Promise<PaginatedResult<PricingListRow>>}
 */
const transformPaginatedPricingResult = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<PricingListRow>>} */
  (transformPageResult(paginatedResult, transformPricingListRecord));

/**
 * Transforms raw pricing rows into a flat export-friendly format.
 *
 * @param {PricingListRow[]} [rows=[]]
 * @returns {Array<Object>}
 */
const transformExportPricingData = (rows = []) =>
  rows.map((row) => ({
    SKU:            row.sku,
    Brand:          row.brand,
    'Product Name': getProductDisplayName(row),
    Barcode:        row.barcode,
    'Size Label':   row.size_label,
    'Country Code': row.country_code,
    'Pricing Type': row.pricing_type,
    Price:          row.price,
    'Valid From':   row.valid_from,
    'Valid To':     row.valid_to,
  }));

/**
 * Transforms a single pricing detail DB row into the detail view shape.
 *
 * @param {PricingDetailRow} row
 * @returns {PricingDetailRecord}
 */
const transformPricingDetailRow = (row) => ({
  pricingType: {
    name: row.pricing_type,
  },
  pricing: {
    locationId:   row.location_id   ?? null,
    locationName: row.location_name ?? null,
    price:        row.price,
    validFrom:    row.valid_from,
    validTo:      row.valid_to,
    status: {
      id:   row.pricing_status_id,
      name: row.pricing_status_name,
    },
    createdAt: row.pricing_created_at,
    createdBy: {
      fullName: getFullName(row.created_by_firstname, row.created_by_lastname),
    },
    updatedAt: row.pricing_updated_at,
    updatedBy: {
      fullName: getFullName(row.updated_by_firstname, row.updated_by_lastname),
    },
  },
  sku: {
    sku:         row.sku,
    barcode:     row.barcode,
    countryCode: row.country_code,
    sizeLabel:   row.size_label,
  },
  product: {
    productName: getProductDisplayName({
      product_name: row.product_name,
      brand:        row.brand_name,
      sku:          row.sku,
      country_code: row.country_code,
    }),
    brand: row.brand_name,
  },
  productCount: row.product_count !== undefined ? Number(row.product_count) : undefined,
});

/**
 * Transforms a paginated pricing detail result set into the detail view shape.
 *
 * @param {Object}            result
 * @param {PricingDetailRow[]} result.data
 * @param {Object}            result.pagination
 * @returns {Promise<PaginatedResult<PricingDetailRow>>}
 */
const transformPaginatedPricingDetailResult = (result) =>
  /** @type {Promise<PaginatedResult<PricingDetailRow>>} */
  (transformPageResult(result, transformPricingDetailRow));

/**
 * Transforms a single SKU pricing record into the SKU pricing DTO shape.
 *
 * Returns `null` if the input row is falsy.
 *
 * @param {Object|null} row
 * @returns {Object|null}
 */
const transformSkuPricing = (row) => {
  if (!row) return null;
  
  return {
    id: row.pricingId ?? row.id,
    pricingGroupId: row.pricingGroupId ?? null,
    skuId: row.skuId,
    priceType: row.priceType?.name ?? null,
    priceTypeCode: row.priceType?.code ?? null,
    countryCode: row.countryCode ?? null,
    price: row.price,
    validFrom: row.validFrom,
    validTo: row.validTo,
    status: row.status
      ? { id: row.status.id, date: row.status.date }
      : undefined,
    audit: row.audit,
  };
};

module.exports = {
  transformPaginatedPricingResult,
  transformExportPricingData,
  transformPaginatedPricingDetailResult,
  transformSkuPricing,
};
