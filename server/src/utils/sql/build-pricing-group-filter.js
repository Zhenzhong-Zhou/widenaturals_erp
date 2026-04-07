/**
 * @file build-pricing-group-filter.js
 * @description SQL WHERE clause builder for pricing group lookup queries.
 */

'use strict';

const {
  normalizeDateRangeFilters,
  applyDateRangeConditions,
} = require('./date-range-utils');
const { applyAuditConditions } = require('./build-audit-filter');

const buildPricingGroupFilters = (filters = {}) => {
  const normalizedFilters = normalizeDateRangeFilters(
    filters,
    'createdAfter',
    'createdBefore'
  );
  
  const conditions = ['1=1'];
  const params = [];
  const paramIndexRef = { value: 1 };
  
  if (normalizedFilters.skuId) {
    conditions.push(`p.sku_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.skuId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.priceTypeId) {
    conditions.push(`pg.price_type_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.priceTypeId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.statusId) {
    conditions.push(`pg.status_id = $${paramIndexRef.value}`);
    params.push(normalizedFilters.statusId);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.countryCode) {
    conditions.push(`pg.country_code = $${paramIndexRef.value}`);
    params.push(normalizedFilters.countryCode);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.brand) {
    conditions.push(`pr.brand = $${paramIndexRef.value}`);
    params.push(normalizedFilters.brand);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.pricingType) {
    conditions.push(`pt.name = $${paramIndexRef.value}`);
    params.push(normalizedFilters.pricingType);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.sizeLabel) {
    conditions.push(`s.size_label = $${paramIndexRef.value}`);
    params.push(normalizedFilters.sizeLabel);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.priceMin != null) {
    conditions.push(`pg.price >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.priceMin);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.priceMax != null) {
    conditions.push(`pg.price <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.priceMax);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.validFrom) {
    conditions.push(`pg.valid_from >= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validFrom);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.validTo) {
    conditions.push(`pg.valid_to <= $${paramIndexRef.value}`);
    params.push(normalizedFilters.validTo);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.validOn) {
    conditions.push(`(
      pg.valid_from <= $${paramIndexRef.value}
      AND (pg.valid_to IS NULL OR pg.valid_to >= $${paramIndexRef.value})
    )`);
    params.push(normalizedFilters.validOn);
    paramIndexRef.value++;
  }
  
  if (normalizedFilters.keyword) {
    const kw = `%${String(normalizedFilters.keyword).trim()}%`;
    conditions.push(`(
      pr.name           ILIKE $${paramIndexRef.value}
      OR s.sku          ILIKE $${paramIndexRef.value}
      OR s.barcode      ILIKE $${paramIndexRef.value}
      OR pt.name        ILIKE $${paramIndexRef.value}
      OR pg.country_code ILIKE $${paramIndexRef.value}
    )`);
    params.push(kw);
    paramIndexRef.value++;
  }
  
  if (
    normalizedFilters._restrictKeywordToValidOnly ||
    normalizedFilters.currentlyValid
  ) {
    conditions.push(`pg.valid_from <= NOW()`);
    conditions.push(`(pg.valid_to IS NULL OR pg.valid_to >= NOW())`);
  }
  
  applyDateRangeConditions({
    conditions,
    params,
    column: 'pg.created_at',
    after: normalizedFilters.createdAfter,
    before: normalizedFilters.createdBefore,
    paramIndexRef,
  });
  
  applyAuditConditions(
    conditions,
    params,
    paramIndexRef,
    normalizedFilters,
    'pg'
  );
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildPricingGroupFilters,
};
