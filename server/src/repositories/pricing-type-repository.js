const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');

const getAllPriceTypes = async ({ page, limit }) => {
  const tableName = 'pricing_types pt';
  const joins = []; // No joins needed for this query
  const whereClause = '1=1'; // Ensures no filtering

  const baseQuery = `
    SELECT
      pt.id,
      pt.name,
      pt.description,
      s.name AS status,
      pt.status_date,
      pt.created_at,
      pt.updated_at,
      CONCAT(COALESCE(cu.firstname, ''), ' ', COALESCE(cu.lastname, '')) AS created_by_fullname,
      CONCAT(COALESCE(uu.firstname, ''), ' ', COALESCE(uu.lastname, '')) AS updated_by_fullname
    FROM pricing_types pt
    INNER JOIN status s ON pt.status_id = s.id
    LEFT JOIN users cu ON pt.created_by = cu.id
    LEFT JOIN users uu ON pt.updated_by = uu.id
  `;

  const params = [];

  try {
    // Execute the paginated query with retry logic
    const result = await retry(
      () =>
        paginateQuery({
          tableName,
          joins,
          whereClause,
          queryText: baseQuery,
          params,
          page,
          limit,
          sortBy: 'pt.name',
          sortOrder: 'ASC',
        }),
      3 // Retry up to 3 times
    );

    logInfo(
      `Successfully fetched ${result.data.length} price types on page ${page}.`
    );
    return result;
  } catch (error) {
    logError('Error fetching price types:', error);
    throw AppError.databaseError('Failed to fetch price types', 500, error);
  }
};

const getPricingTypeById = async (pricingTypeId) => {
  const pricingTypeQuery = `
    SELECT
      pt.id AS pricing_type_id,
      pt.name AS pricing_type_name,
      pt.description AS pricing_type_description,
      pts.name AS status,
      pt.status_date,
      pt.created_at,
      pt.updated_at,
      jsonb_build_object(
          'id', created_by_user.id,
          'full_name', COALESCE(created_by_user.firstname || ' ' || created_by_user.lastname, 'Unknown')
      ) AS created_by,
      jsonb_build_object(
          'id', updated_by_user.id,
          'full_name', COALESCE(updated_by_user.firstname || ' ' || updated_by_user.lastname, 'Unknown')
      ) AS updated_by
    FROM pricing_types pt
    LEFT JOIN status pts ON pt.status_id = pts.id
    LEFT JOIN users created_by_user ON pt.created_by = created_by_user.id
    LEFT JOIN users updated_by_user ON pt.updated_by = updated_by_user.id
    WHERE pt.id = $1;
  `;

  try {
    return await retry(async () => {
      const result = await query(pricingTypeQuery, [pricingTypeId]);
      return result.rows.length ? result.rows[0] : null;
    });
  } catch (error) {
    throw AppError.databaseError('Failed to fetch pricing type details');
  }
};

module.exports = {
  getAllPriceTypes,
  getPricingTypeById,
};
