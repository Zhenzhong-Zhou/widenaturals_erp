const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemError, logSystemInfo } = require('../utils/system-logger');
const { logError, logWarn } = require('../utils/logger-helper');

/**
 * Fetches paginated pricing types with optional filters.
 *
 * - If `canViewAllStatuses` is false: only pricing types with the specified `statusId` are returned (usually 'active').
 * - Supports optional search (on name/code) and filtering by `status_date` range.
 *
 * @param {object} options
 * @param {number} options.page - Page number for pagination.
 * @param {number} options.limit - Number of items per page.
 * @param {string} [options.statusId] - UUID of status to filter by (required if `canViewAllStatuses` is false).
 * @param {string} [options.search] - Search string for filtering by name/code.
 * @param {string} [options.startDate] - Filter by status_date (start).
 * @param {string} [options.endDate] - Filter by status_date (end).
 * @param {boolean} [options.canViewAllStatuses=false] - If true, no status filter is enforced unless provided.
 * @returns {Promise<object>} Paginated pricing types.
 */
const getAllPriceTypes = async ({
                                  page,
                                  limit,
                                  statusId,
                                  search,
                                  startDate,
                                  endDate,
                                  canViewAllStatuses = false,
                                }) => {
  const tableName = 'pricing_types pt';
  const joins = [
    'JOIN status s ON pt.status_id = s.id',
    'LEFT JOIN users cu ON pt.created_by = cu.id',
    'LEFT JOIN users uu ON pt.updated_by = uu.id',
  ];
  
  const params = [];
  const whereClauses = [];
  let paramIndex = 1;
  
  // Apply status filter if permission doesn't allow unrestricted view
  if (!canViewAllStatuses || (canViewAllStatuses && statusId)) {
    whereClauses.push(`pt.status_id = $${paramIndex++}`);
    params.push(statusId);
  }
  
  // Optional keyword search
  if (search) {
    whereClauses.push(`(LOWER(pt.name) ILIKE $${paramIndex} OR LOWER(pt.code) ILIKE $${paramIndex})`);
    params.push(`%${search.toLowerCase()}%`);
    paramIndex++;
  }
  
  // Optional status_date range filter
  if (startDate && endDate) {
    whereClauses.push(`pt.status_date BETWEEN $${paramIndex++} AND $${paramIndex++}`);
    params.push(startDate, endDate);
  }
  
  const whereClause = whereClauses.length > 0 ? whereClauses.join(' AND ') : '1=1';
  
  const baseQuery = `
    SELECT
      pt.id,
      pt.name,
      pt.code,
      pt.slug,
      pt.description,
      s.name AS status,
      pt.status_date,
      pt.created_at,
      pt.updated_at,
      CONCAT(COALESCE(cu.firstname, ''), ' ', COALESCE(cu.lastname, '')) AS created_by_fullname,
      CONCAT(COALESCE(uu.firstname, ''), ' ', COALESCE(uu.lastname, '')) AS updated_by_fullname
    FROM pricing_types pt
    ${joins.join(' ')}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQuery,
      params,
      page,
      limit,
      sortBy: 'pt.name',
      sortOrder: 'ASC',
    });
    
    logSystemInfo('Fetched paginated pricing types', {
      context: 'pricing-types-repository',
      page,
      limit,
      resultCount: result.data.length,
    });
    
    return result;
  } catch (error) {
    logSystemError('Failed to fetch paginated pricing types', {
      context: 'pricing-types-repository',
      page,
      limit,
      error,
    });
    
    throw AppError.databaseError('Unable to retrieve pricing types at this time.');
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

/**
 * Repository function to check if a price type exists by ID.
 * @param {string} priceTypeId - The UUID of the price type.
 * @param {object} client - Database transaction client (optional for transactions).
 * @returns {Promise<boolean>} - Returns true if the price type exists, otherwise false.
 */
const checkPriceTypeExists = async (priceTypeId, client = null) => {
  try {
    const queryText = `SELECT EXISTS (SELECT 1 FROM price_types WHERE id = $1) AS exists;`;
    const { rows } = await query(queryText, [priceTypeId], client);
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking price type existence:', error);
    throw AppError.databaseError('Failed to check price type existence');
  }
};

/**
 * Fetches active pricing types for dropdown selection linked to a specific product.
 * Only fetches active status types and includes price information in the label.
 *
 * @param {string} productId - The ID of the product for which to fetch pricing types.
 * @returns {Promise<Array<{ id: string, label: string }>>} - List of formatted pricing types for dropdown.
 * @throws {Error} - Throws an error if productId is not provided or if the fetch fails.
 */
const getPricingTypesForDropdown = async (productId) => {
  try {
    const queryText = `
      SELECT
        pt.id,
        CONCAT(pt.name, ' - $', p.price) AS label
      FROM pricing_types pt
      JOIN pricing p ON p.price_type_id = pt.id
      JOIN products prod ON prod.id = p.product_id
      JOIN status s ON pt.status_id = s.id
      WHERE s.name = 'active'
        AND prod.id = $1
      ORDER BY pt.name ASC;
    `;

    const { rows } = await query(queryText, [productId]);
    return rows;
  } catch (error) {
    logError('Error fetching pricing types for dropdown:', error);
    throw AppError.databaseError('Failed to fetch pricing types.');
  }
};

module.exports = {
  getAllPriceTypes,
  getPricingTypeById,
  checkPriceTypeExists,
  getPricingTypesForDropdown,
};
