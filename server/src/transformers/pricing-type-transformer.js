const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms a raw pricing type DB row into a formatted object.
 *
 * @param {object} row - Raw row from the database.
 * @returns {object} - Transformed pricing type object.
 */
const transformPricingTypeRow = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  slug: row.slug || null,
  description: row.description || null,
  status: row.status,
  statusDate: row.status_date ? new Date(row.status_date).toISOString() : null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  createdByFullName: row.created_by_fullname || null,
  updatedByFullName: row.updated_by_fullname || null,
});

/**
 * Transforms a paginated result of pricing types using the shared pagination utility.
 *
 * @param {object} paginatedResult - Raw paginated result from the database.
 * @param {Array<object>} paginatedResult.data - Raw pricing type rows.
 * @param {object} paginatedResult.pagination - Metadata including page, limit, totalRecords, totalPages.
 * @returns {object} Transformed response with pagination and formatted pricing type records.
 */
const transformPaginatedPricingTypeResult = (paginatedResult) =>
  transformPaginatedResult(paginatedResult, transformPricingTypeRow);

/**
 * Transforms a flat row from the pricing type metadata query
 * into a structured object with nested status and user info.
 *
 * @param {object} row - The raw database result row.
 * @param {string} row.pricing_type_id - UUID of the pricing type.
 * @param {string} row.pricing_type_name - Display name of the pricing type.
 * @param {string} row.pricing_type_code - Unique code of the pricing type.
 * @param {string} row.pricing_type_slug - URL-friendly slug.
 * @param {string} row.pricing_type_description - Description text.
 * @param {string} row.status_id - Status ID (foreign key).
 * @param {string} row.status_name - Status label (e.g., 'active').
 * @param {string} row.status_date - Date of status change.
 * @param {Date} row.pricing_type_created_at - Creation timestamp.
 * @param {Date|null} row.pricing_type_updated_at - Last update timestamp.
 * @param {string} row.created_by_id - Creator's user ID.
 * @param {string|null} row.created_by_firstname - Creator's first name.
 * @param {string|null} row.created_by_lastname - Creator's last name.
 * @param {string|null} row.updated_by_id - Updater's user ID.
 * @param {string|null} row.updated_by_firstname - Updater's first name.
 * @param {string|null} row.updated_by_lastname - Updater's last name.
 *
 * @returns {{
 *   id: string,
 *   name: string,
 *   code: string,
 *   slug: string,
 *   description: string,
 *   status: { id: string, name: string, statusDate: string },
 *   createdBy: { id: string, fullName: string },
 *   updatedBy: { id: string | null, fullName: string },
 *   createdAt: string,
 *   updatedAt: string | null
 * }}
 */
const transformPricingTypeMetadata = (row) => ({
  id: row.pricing_type_id,
  name: row.pricing_type_name,
  code: row.pricing_type_code,
  slug: row.pricing_type_slug,
  description: row.pricing_type_description,
  status: {
    id: row.status_id,
    name: row.status_name,
    statusDate: row.status_date,
  },
  createdBy: {
    id: row.created_by_id,
    fullName:
      `${row.created_by_firstname || ''} ${row.created_by_lastname || ''}`.trim() ||
      null,
  },
  updatedBy: {
    id: row.updated_by_id,
    fullName:
      `${row.updated_by_firstname || ''} ${row.updated_by_lastname || ''}`.trim() ||
      null,
  },
  createdAt: row.pricing_type_created_at,
  updatedAt: row.pricing_type_updated_at,
});

module.exports = {
  transformPaginatedPricingTypeResult,
  transformPricingTypeMetadata,
};
