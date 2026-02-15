const {
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalUUID,
  validateOptionalString,
  createBooleanFlag,
  createdDateRangeSchema,
  updatedDateRangeSchema,
} = require('./general-validators');

/**
 * Joi schema for validating location list query parameters.
 *
 * Combines pagination, sorting, and domain-specific filters
 * into a single schema for use in:
 * - createQueryNormalizationMiddleware
 * - location controllers
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
 * - `sortBy` (default: `createdAt`, validated against locationSortMap)
 * - `sortOrder` (`ASC` | `DESC`)
 *
 * #### Location Filters
 * - `statusIds` → array of Location Status IDs
 * - `locationTypeId` → UUID of location type
 * - `city` → partial city match
 * - `province_or_state` → partial province/state match
 * - `country` → partial country match
 * - `includeArchived` → include archived records (default false)
 * - `createdBy` → user UUID who created the record
 * - `updatedBy` → user UUID who last updated the record
 *
 * #### Date Range
 * - `createdAfter`
 * - `createdBefore`
 *
 * #### Keyword Search
 * - `keyword` → fuzzy match across name, address, city, province, postal code, country
 *
 * ---
 *
 * @type {Joi.ObjectSchema}
 */
const locationQuerySchema = paginationSchema
  // default sort field must exist in locationSortMap
  .concat(createSortSchema('createdAt'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .keys({
    // -------------------------------------------------------------
    // Status filtering
    // -------------------------------------------------------------
    statusIds: validateUUIDOrUUIDArrayOptional('Location Status IDs'),

    // -------------------------------------------------------------
    // Location type
    // -------------------------------------------------------------
    locationTypeId: validateOptionalUUID('Location Type ID'),

    // -------------------------------------------------------------
    // Geographic filters
    // -------------------------------------------------------------
    city: validateOptionalString('City (partial match allowed)'),
    province_or_state: validateOptionalString(
      'Province or State (partial match allowed)'
    ),
    country: validateOptionalString('Country (partial match allowed)'),

    // -------------------------------------------------------------
    // Archive handling
    // -------------------------------------------------------------
    includeArchived: createBooleanFlag('Include Archived').description(
      'Whether to include archived locations'
    ),

    // -------------------------------------------------------------
    // Audit filters
    // -------------------------------------------------------------
    createdBy: validateOptionalUUID('Location Created By User ID'),
    updatedBy: validateOptionalUUID('Location Updated By User ID'),

    // -------------------------------------------------------------
    // Keyword search
    // -------------------------------------------------------------
    keyword: validateOptionalString(
      'Keyword for fuzzy matching across name and address fields'
    ),
  });

module.exports = {
  locationQuerySchema,
};
