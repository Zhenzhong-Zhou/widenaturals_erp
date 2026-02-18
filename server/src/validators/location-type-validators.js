const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  validateOptionalUUID,
  validateUUID,
} = require('./general-validators');

/**
 * Joi schema for validating location type list query parameters.
 *
 * Combines pagination, sorting, and domain-specific filters
 * into a single schema for use in:
 * - createQueryNormalizationMiddleware
 * - location type controllers
 *
 * ---
 *
 * ### Includes
 *
 * #### Pagination
 * - `page` (default: 1)
 * - `limit` (default: 10)
 *
 * #### Sorting
 * - `sortBy` (default: `createdAt`, validated against locationTypeSortMap)
 * - `sortOrder` (`ASC` | `DESC`)
 *
 * #### Status Filtering
 * - `statusIds` → array of Location Type Status IDs
 *
 * #### Core Fields
 * - `name` → partial name match
 *
 * #### Audit Filters
 * - `createdBy` → user UUID who created the record
 * - `updatedBy` → user UUID who last updated the record
 *
 * #### Date Range
 * - `createdAfter`
 * - `createdBefore`
 * - `updatedAfter`
 * - `updatedBefore`
 *
 * #### Keyword Search
 * - `keyword` → fuzzy match across code and name
 *
 * ---
 *
 * @type {Joi.ObjectSchema}
 */
const locationTypeQuerySchema = paginationSchema
  // default sort field must exist in locationTypeSortMap
  .concat(createSortSchema('createdAt'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .keys({
    // -------------------------------------------------------------
    // Status filtering
    // -------------------------------------------------------------
    statusIds: validateUUIDOrUUIDArrayOptional('Location Type Status IDs'),

    // -------------------------------------------------------------
    // Core identity filters
    // -------------------------------------------------------------
    name: validateOptionalString('Location Type Name (partial match allowed)'),

    // -------------------------------------------------------------
    // Audit filters
    // -------------------------------------------------------------
    createdBy: validateOptionalUUID('Location Type Created By User ID'),

    updatedBy: validateOptionalUUID('Location Type Updated By User ID'),

    // -------------------------------------------------------------
    // Keyword search
    // -------------------------------------------------------------
    keyword: validateOptionalString(
      'Keyword for fuzzy matching across code and name'
    ),
  });

/**
 * Joi schema for validating the `locationTypeId` route parameter.
 *
 * Fields:
 * - `locationTypeId` (UUID)
 *    - Required
 *    - Must be a valid UUID (typically version 4)
 *
 * Common usage:
 * - Route validation for endpoints like:
 *     GET /location-types/:locationTypeId
 *     PATCH /location-types/:locationTypeId
 *     DELETE /location-types/:locationTypeId
 */
const locationTypeIdParamSchema = Joi.object({
  locationTypeId: validateUUID('Location Type ID'),
});

module.exports = {
  locationTypeQuerySchema,
  locationTypeIdParamSchema,
};
