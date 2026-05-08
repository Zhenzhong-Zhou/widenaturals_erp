/**
 * @file enrich-status-lookup-option.js
 * @description Shared enricher that normalises a status row's active
 * flag for lookup workflows.
 *
 * Pure function — no side effects on inputs. Accepts either snake_case
 * (`is_active`, raw from pg) or camelCase (`isActive`, post-transform)
 * input shapes so it can run anywhere in the lookup pipeline.
 *
 * Exports:
 *  - enrichStatusLookupOption
 */

'use strict';

/**
 * Enriches a status lookup row with a normalised `isActive` boolean
 * flag.
 *
 * Accepts either `is_active` (snake_case from DB) or `isActive`
 * (camelCase from transformer) to handle both raw and transformed
 * row shapes.
 *
 * @param {Object} row - Raw or transformed status row.
 * @returns {Object & { isActive: boolean }}
 */
const enrichStatusLookupOption = (row) => {
  const isActive =
    typeof row.is_active === 'boolean'
      ? row.is_active
      : Boolean(row.isActive);
  
  return {
    ...row,
    isActive,
  };
};

module.exports = {
  enrichStatusLookupOption,
};
