const { query, retry, paginateQuery } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper'); // Ensure this is your PostgreSQL connection instance

/**
 * Fetch all compliance records with product details.
 * @returns {Promise<Array>} List of compliance records.
 */
const getAllCompliances = async (
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC'
) => {
  const tableName = 'compliances c';
  const joins = [
    'INNER JOIN products p ON c.product_id = p.id',
    'INNER JOIN status s ON c.status_id = s.id',
    'LEFT JOIN users u1 ON c.created_by = u1.id',
    'LEFT JOIN users u2 ON c.updated_by = u2.id',
  ];
  const whereClause = '1=1';

  const allowedSortFields = [
    'created_at',
    'updated_at',
    'compliance_id',
    'issued_date',
    'expiry_date',
  ];

  // Validate the sortBy field
  const validatedSortBy = allowedSortFields.includes(sortBy)
    ? `c.${sortBy}`
    : 'c.created_at';

  const baseQuery = `
    SELECT
      c.id,
      c.product_id,
      p.product_name,
      c.type,
      c.compliance_id,
      c.issued_date,
      c.expiry_date,
      c.description,
      s.name AS status_name,
      c.status_date,
      c.created_at,
      c.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'System Action') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;

  try {
    return await retry(
      () =>
        paginateQuery({
          tableName,
          joins,
          whereClause,
          queryText: baseQuery,
          params: [],
          page,
          limit,
          sortBy: validatedSortBy,
          sortOrder,
        }),
      3 // Retry up to 3 times
    );
  } catch (error) {
    logError('Error fetching compliances:', error);
    throw AppError.databaseError('Error fetching compliances:', error);
  }
};

module.exports = {
  getAllCompliances,
};
