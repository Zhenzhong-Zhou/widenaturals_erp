/**
 * @file build-audit-filter.js
 * @description Shared SQL audit field conditions for filter builders.
 *
 * Exports:
 *  - applyAuditConditions
 */

'use strict';

/**
 * Appends created_by and updated_by conditions to an existing conditions array.
 *
 * Mutates conditions, params, and paramIndexRef in place.
 *
 * @param {string[]}          conditions    - Accumulator array of SQL condition strings.
 * @param {Array}             params        - Accumulator array of bound parameter values.
 * @param {{ value: number }} paramIndexRef - Mutable ref tracking the current $N index.
 * @param {Object}            filters       - Already-normalized filter object.
 * @param {string}            alias         - Table alias prefix (e.g. 'p', 'o', 'cr').
 * @param {string}            [filters.createdBy] - Filter by creator UUID.
 * @param {string}            [filters.updatedBy] - Filter by updater UUID.
 */
const applyAuditConditions = (conditions, params, paramIndexRef, filters, alias) => {
  if (filters.createdBy) {
    conditions.push(`${alias}.created_by = $${paramIndexRef.value}`);
    params.push(filters.createdBy);
    paramIndexRef.value++;
  }
  
  if (filters.updatedBy) {
    conditions.push(`${alias}.updated_by = $${paramIndexRef.value}`);
    params.push(filters.updatedBy);
    paramIndexRef.value++;
  }
};

module.exports = {
  applyAuditConditions,
};
