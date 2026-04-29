/**
 * @file warehouse-validators.js
 * @description Joi validation schemas for warehouse endpoints.
 *
 * Covers route param validation for single-record endpoints and query
 * parameter validation for the paginated list endpoint.
 *
 * Exports:
 *  - warehouseIdParamSchema   — warehouseId route param
 *  - warehouseQuerySchema     — paginated list query filters and sort
 */

'use strict';

const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  validateOptionalUUID,
  validateOptionalString,
  validateUUID,
} = require('./general-validators');

// ── Param schema ──────────────────────────────────────────────────────────────

/**
 * Validates route params for warehouse detail endpoints.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} warehouseId - UUID of the target warehouse record.
 */
const warehouseIdParamSchema = Joi.object({
  warehouseId: validateUUID('Warehouse ID'),
});

// ── Query schema (GET /warehouses) ────────────────────────────────────────────

/**
 * Validates query parameters for the paginated warehouse list endpoint.
 *
 * Extends base pagination, sort, created date range, and updated date range
 * schemas with warehouse-specific filters.
 *
 * @type {Joi.ObjectSchema}
 * @property {string}  [statusId]       - Filter by warehouse status UUID.
 * @property {boolean} [isArchived]     - Filter by archived flag.
 * @property {string}  [warehouseTypeId] - Filter by warehouse type UUID.
 * @property {string}  [locationId]     - Filter by location UUID.
 * @property {string}  [name]           - Partial match on warehouse name.
 * @property {string}  [code]           - Partial match on warehouse code.
 * @property {string}  [createdBy]      - Filter by creator user UUID.
 * @property {string}  [updatedBy]      - Filter by last-updater user UUID.
 * @property {string}  [createdAfter]   - ISO date lower bound for created_at (inclusive).
 * @property {string}  [createdBefore]  - ISO date upper bound for created_at (exclusive).
 * @property {string}  [updatedAfter]   - ISO date lower bound for updated_at (inclusive).
 * @property {string}  [updatedBefore]  - ISO date upper bound for updated_at (exclusive).
 * @property {string}  [keyword]        - ILIKE search across name and code.
 */
const warehouseQuerySchema = paginationSchema
  .concat(createSortSchema('warehouseName'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .concat(
    Joi.object({
      statusId:        validateOptionalUUID('Status ID'),
      isArchived:      Joi.boolean().optional().messages({
        'boolean.base': 'Is Archived must be a boolean.',
      }),
      warehouseTypeId: validateOptionalUUID('Warehouse Type ID'),
      locationId:      validateOptionalUUID('Location ID'),
      name:            validateOptionalString('Warehouse Name'),
      code:            validateOptionalString('Warehouse Code'),
      createdBy:       validateOptionalUUID('Created By'),
      updatedBy:       validateOptionalUUID('Updated By'),
      keyword:         validateOptionalString('Keyword'),
    })
  );

module.exports = {
  warehouseIdParamSchema,
  warehouseQuerySchema,
};
