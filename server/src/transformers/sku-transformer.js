/**
 * @file sku-transformer.js
 * @description Row-level and page-level transformers for SKU records.
 *
 * Exports:
 *   - transformPaginatedSkuProductCardResult – paginated SKU product card list
 *   - transformPaginatedSkuListResults       – paginated SKU table list
 *   - transformSkuRecord                     – bulk insert result records
 *   - transformSkuDetail                     – full SKU detail with images, pricing, compliance
 *
 * Internal helpers (not exported):
 *   - transformSkuProductCardRow – per-row transformer for product card view
 *   - transformSkuListRecord     – per-row transformer for table list view
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { getProductDisplayName }           = require('../utils/display-name-utils');
const { transformPageResult }             = require('../utils/transformer-utils');
const { cleanObject }                     = require('../utils/object-utils');
const { transformSkuImageGroupsForDetail } = require('./sku-image-transformer');
const { transformSkuPricing }             = require('./pricing-transformer');
const { transformComplianceRecord }       = require('./compliance-record-transformer');
const { makeStatus }                      = require('../utils/status-utils');
const { compactAudit, makeAudit }         = require('../utils/audit-utils');

/**
 * Transforms a single SKU product card DB row into the card view shape.
 *
 * Derives a unified status from product and SKU status fields.
 * Returns `null` if the row is falsy.
 *
 * @param {SkuProductCardRow} row
 * @returns {Object|null}
 */
const transformSkuProductCardRow = (row) => {
  if (!row) return null;
  
  const productStatus = row.product_status_name || null;
  const skuStatus     = row.sku_status_name     || null;
  
  // Unified status — null if both absent, string if equal, object if divergent.
  const status =
    !productStatus && !skuStatus   ? null
      : productStatus === skuStatus  ? productStatus
        : { product: productStatus, sku: skuStatus };
  
  const compliance = row.compliance_type || row.compliance_id
    ? { type: row.compliance_type || null, number: row.compliance_id || null }
    : null;
  
  return {
    skuId:       row.sku_id,
    skuCode:     row.sku_code,
    barcode:     row.barcode,
    displayName: getProductDisplayName(row),
    brand:       row.brand,
    series:      row.series,
    category:    row.category,
    status,
    compliance,
    price:  { msrp: row.msrp_price ? Number(row.msrp_price) : null },
    image:  { url: row.primary_image_url || null, alt: row.image_alt_text || '' },
  };
};

/**
 * Transforms a paginated SKU product card result set into the card view shape.
 *
 * @param {Object}              paginatedResult
 * @param {SkuProductCardRow[]} paginatedResult.data
 * @param {Object}              paginatedResult.pagination
 * @returns {Promise<PaginatedResult<SkuProductCardRow>>}
 */
const transformPaginatedSkuProductCardResult = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<SkuProductCardRow>>} */
  (transformPageResult(paginatedResult, transformSkuProductCardRow));

/**
 * Transforms a single SKU list DB row into the table view shape.
 *
 * Returns `null` if the row is falsy.
 *
 * @param {SkuListRow} row
 * @returns {Object|null}
 */
const transformSkuListRecord = (row) => {
  if (!row) return null;
  
  const displayLabel = [
    row.brand,
    row.product_name,
    row.size_label ? `— ${row.size_label}` : null,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  
  return cleanObject({
    id:               row.sku_id,
    productId:        row.product_id,
    sku:              row.sku,
    barcode:          row.barcode,
    language:         row.language,
    countryCode:      row.country_code,
    marketRegion:     row.market_region,
    sizeLabel:        row.size_label,
    displayLabel,
    primaryImageUrl:  row.primary_image_url || null,
    product: {
      id:          row.product_id,
      name:        row.product_name,
      series:      row.series,
      brand:       row.brand,
      category:    row.category,
      displayName: getProductDisplayName(row),
    },
    status: makeStatus(row),
    audit:  compactAudit(makeAudit(row)),
  });
};

/**
 * Transforms a paginated SKU list result set into the table view shape.
 *
 * @param {Object}        paginatedResult
 * @param {SkuListRow[]}  paginatedResult.data
 * @param {Object}        paginatedResult.pagination
 * @returns {Promise<PaginatedResult<SkuListRow>>}
 */
const transformPaginatedSkuListResults = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<SkuListRow>>} */
  (transformPageResult(paginatedResult, transformSkuListRecord));

/**
 * Transforms an array of SKU insert rows into ID + SKU code result records.
 *
 * @param {SkuInsertRow[]} skuRows
 * @param {string[]}       [generatedSkus=[]]
 * @returns {SkuInsertRecord[]}
 */
const transformSkuRecord = (skuRows, generatedSkus = []) => {
  if (!Array.isArray(skuRows) || skuRows.length === 0) return [];
  
  return skuRows.map((row, idx) => ({
    id:      row.id,
    skuCode: generatedSkus[idx] ?? null,
  }));
};

/**
 * Transforms a full SKU detail object (with related data) into the detail response shape.
 *
 * Combines SKU fields with images, pricing, and compliance records,
 * each transformed by their respective transformers.
 *
 * Returns `null` if `sku` is falsy.
 *
 * @param {{ sku: SkuDetailRow, images: Array, pricing: Array, complianceRecords: Array }} params
 * @returns {Object|null}
 */
const transformSkuDetail = ({ sku, images, pricing, complianceRecords }) => {
  if (!sku) return null;
  
  return {
    id:          sku.sku_id,
    sku:         sku.sku,
    barcode:     sku.barcode,
    description: sku.sku_description,
    language:    sku.language,
    sizeLabel:   sku.size_label,
    countryCode: sku.country_code,
    marketRegion: sku.market_region,
    
    product: {
      id:          sku.product_id,
      name:        sku.product_name,
      series:      sku.product_series,
      brand:       sku.product_brand,
      category:    sku.product_category,
      displayName: getProductDisplayName({
        product_name: sku.product_name,
        brand:        sku.brand,
        sku:          sku.sku_code,
        country_code: sku.country_code,
        size_label:   sku.size_label,
        display_name: sku.display_name,
      }),
    },
    
    dimensions: {
      cm: {
        length: sku.length_cm,
        width:  sku.width_cm,
        height: sku.height_cm,
      },
      inches: {
        length: sku.length_inch,
        width:  sku.width_inch,
        height: sku.height_inch,
      },
      weight: {
        g:  sku.weight_g,
        lb: sku.weight_lb,
      },
    },
    
    status: makeStatus(sku, {
      id:   'sku_status_id',
      name: 'sku_status_name',
      date: 'sku_status_date',
    }),
    
    audit: compactAudit(makeAudit(sku)),
    
    images:            transformSkuImageGroupsForDetail(images ?? []),
    pricing:           pricing?.map(transformSkuPricing)         ?? [],
    complianceRecords: complianceRecords?.map(transformComplianceRecord) ?? [],
  };
};

module.exports = {
  transformPaginatedSkuProductCardResult,
  transformPaginatedSkuListResults,
  transformSkuRecord,
  transformSkuDetail,
};
