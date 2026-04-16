/**
 * @file build-product-base-filter.js
 * @description Shared SQL filter conditions for product-related queries.
 *
 * Used by buildProductFilter and buildComplianceRecordFilter which both
 * filter on product fields (brand, category, series) via the same p.* alias.
 *
 * Exports:
 *  - applyProductFieldConditions
 */

'use strict';

/**
 * Appends product field conditions to an existing conditions array.
 *
 * Mutates conditions, params, and paramIndexRef in place — designed to be
 * called as part of a larger filter builder.
 *
 * @param {string[]}          conditions    - Accumulator array of SQL condition strings.
 * @param {Array}             params        - Accumulator array of bound parameter values.
 * @param {{ value: number }} paramIndexRef - Mutable ref tracking the current $N index.
 * @param {Object}            filters       - Already-normalized filter object.
 * @param {string}            [filters.brand]    - ILIKE filter on p.brand.
 * @param {string}            [filters.category] - ILIKE filter on p.category.
 * @param {string}            [filters.series]   - ILIKE filter on p.series.
 */
const applyProductFieldConditions = (
  conditions,
  params,
  paramIndexRef,
  filters
) => {
  if (filters.brand) {
    conditions.push(`p.brand ILIKE $${paramIndexRef.value}`);
    params.push(`%${filters.brand}%`);
    paramIndexRef.value++;
  }

  if (filters.category) {
    conditions.push(`p.category ILIKE $${paramIndexRef.value}`);
    params.push(`%${filters.category}%`);
    paramIndexRef.value++;
  }

  if (filters.series) {
    conditions.push(`p.series ILIKE $${paramIndexRef.value}`);
    params.push(`%${filters.series}%`);
    paramIndexRef.value++;
  }
};

module.exports = {
  applyProductFieldConditions,
};
