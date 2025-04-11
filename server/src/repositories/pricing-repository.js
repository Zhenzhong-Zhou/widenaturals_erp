const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const getPricingDetailsByPricingTypeId = async ({
  pricingTypeId,
  page,
  limit,
}) => {
  const tableName = 'pricing pr';
  const joins = [
    'LEFT JOIN products p ON pr.product_id = p.id',
    'LEFT JOIN locations l ON pr.location_id = l.id',
    'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
    'LEFT JOIN status ps ON pr.status_id = ps.id',
  ];
  const whereClause = 'pr.price_type_id = $1';

  const pricingDetailsQuery = `
    SELECT
      pr.id AS pricing_id,
      pr.price,
      pr.valid_from,
      pr.valid_to,
      pr.status_date,
      ps.name AS status,
      pr.created_at,
      pr.updated_at,
      jsonb_build_object(
          'id', created_by_user.id,
          'full_name', COALESCE(created_by_user.firstname || ' ' || created_by_user.lastname, 'Unknown')
      ) AS created_by,
      jsonb_build_object(
          'id', updated_by_user.id,
          'full_name', COALESCE(updated_by_user.firstname || ' ' || updated_by_user.lastname, 'Unknown')
      ) AS updated_by,
      jsonb_build_object(
          'id', p.id,
          'name', p.product_name,
          'series', p.series,
          'brand', p.brand,
          'category', p.category,
          'barcode', p.barcode,
          'market_region', p.market_region
      ) AS product,
      jsonb_build_object(
          'id', l.id,
          'name', l.name,
          'type', lt.name
      ) AS location
    FROM pricing pr
    LEFT JOIN products p ON pr.product_id = p.id
    LEFT JOIN locations l ON pr.location_id = l.id
    LEFT JOIN location_types lt ON l.location_type_id = lt.id
    LEFT JOIN status ps ON pr.status_id = ps.id
    LEFT JOIN users created_by_user ON pr.created_by = created_by_user.id
    LEFT JOIN users updated_by_user ON pr.updated_by = updated_by_user.id
    WHERE pr.price_type_id = $1
  `;

  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: pricingDetailsQuery,
        params: [pricingTypeId],
        page,
        limit,
        sortBy: 'p.product_name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    throw AppError.databaseError('Failed to fetch pricing details', error);
  }
};

/**
 * Fetches paginated pricing records with related entity names.
 * @param {Object} options - Options for the paginated query.
 * @param {number} [options.page=1] - Current page number (1-based index).
 * @param {number} [options.limit=10] - Number of records per page.
 * @returns {Promise<Object>} - Returns an object with `data` (records) and `pagination` (metadata).
 */
const getPricings = async ({ page, limit }) => {
  const tableName = 'pricing p'; // Alias for pricing table

  const joins = [
    'LEFT JOIN products pr ON p.product_id = pr.id',
    'LEFT JOIN pricing_types pt ON p.price_type_id = pt.id',
    'LEFT JOIN locations l ON p.location_id = l.id',
    'LEFT JOIN status s ON p.status_id = s.id',
    'LEFT JOIN users u1 ON p.created_by = u1.id',
    'LEFT JOIN users u2 ON p.updated_by = u2.id',
  ];

  const whereClause = '1=1'; // Default where clause

  const baseQuery = `
    SELECT
      p.id AS pricing_id,
      pr.product_name,
      pt.name AS price_type,
      l.name AS location,
      p.price,
      p.valid_from,
      p.valid_to,
      s.name AS status_name,
      p.status_date,
      p.created_at,
      p.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;

  try {
    return await retry(() =>
      paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [],
        page,
        limit,
        sortBy: 'pr.product_name',
        sortOrder: 'ASC',
      })
    );
  } catch (error) {
    throw AppError.databaseError('Failed to fetch pricing data', error);
  }
};

/**
 * Fetch pricing details with product, location, and created/updated user full names.
 * @param {Object} params - The parameters.
 * @param {string} params.pricingId - The UUID of the pricing record.
 * @param {number} params.page - The current page number.
 * @param {number} params.limit - The number of records per page.
 * @returns {Promise<Object>} - Returns pricing details with related product and location.
 */
const getPricingDetailsByPricingId = async ({ pricingId, page, limit }) => {
  const tableName = 'pricing p';

  const joins = [
    'LEFT JOIN products pr ON p.product_id = pr.id',
    'LEFT JOIN pricing_types pt ON p.price_type_id = pt.id',
    'LEFT JOIN locations l ON p.location_id = l.id',
    'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
    'LEFT JOIN status s ON p.status_id = s.id',
    'LEFT JOIN users u1 ON p.created_by = u1.id',
    'LEFT JOIN users u2 ON p.updated_by = u2.id',
  ];

  const whereClause = 'p.id = $1';

  const baseQuery = `
      SELECT
        p.id AS pricing_id,
        pt.name AS price_type_name,
        p.price,
        p.valid_from,
        p.valid_to,
        s.name AS status_name,
        p.status_date,
        p.created_at,
        p.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
        jsonb_agg(DISTINCT jsonb_build_object(
            'product_id', pr.id,
            'name', pr.product_name,
            'brand', pr.brand,
            'category', pr.category,
            'barcode', pr.barcode,
            'market_region', pr.market_region
        )) AS products,
        jsonb_agg(DISTINCT jsonb_build_object(
            'location_id', l.id,
            'location_name', l.name,
            'location_type', jsonb_build_object(
                'type_id', lt.id,
                'type_name', lt.name
            )
        )) AS locations
      FROM ${tableName}
      ${joins.join(' ')}
      WHERE ${whereClause}
      GROUP BY p.id, pt.name, p.price, p.valid_from, p.valid_to,
      s.name, p.status_date, p.created_at, p.updated_at,
      u1.firstname, u1.lastname, u2.firstname, u2.lastname
  `;

  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery, // Corrected variable name
        params: [pricingId], // Corrected parameter name
        page,
        limit,
        sortBy: 'pt.name',
        sortOrder: 'ASC',
      });
    });
  } catch (error) {
    throw AppError.databaseError(
      `Error fetching pricing details: ${error.message}`,
      error
    );
  }
};

/**
 * Retrieves the active price ID and value for a given product and price type.
 *
 * This function queries the `pricing` table to fetch the most recent valid price
 * for the specified product and price type. It ensures that only active and valid
 * prices are considered, filtering by `status_id` and `valid_to` date.
 *
 * @param {string} productId - The unique identifier of the product.
 * @param {string} priceTypeId - The unique identifier of the price type.
 * @param {object} client - The database transaction client (optional).
 * @returns {Promise<{ price_id: string, price: number } | null>} - The active price details, or `null` if no valid price is found.
 */
const getActiveProductPrice = async (productId, priceTypeId, client) => {
  const queryText = `
    SELECT
      p.id,
      p.price
    FROM pricing p
    INNER JOIN status s ON p.status_id = s.id
    WHERE p.product_id = $1
      AND p.price_type_id = $2
      AND s.name = 'active'
      AND now() >= p.valid_from
      AND (p.valid_to IS NULL OR now() <= p.valid_to)
    ORDER BY p.valid_from DESC
    LIMIT 1;
  `;

  try {
    const { rows } = await query(queryText, [productId, priceTypeId], client);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logError('Error fetching price for order:', error);
    throw AppError.databaseError('Failed to fetch price for order');
  }
};

module.exports = {
  getPricingDetailsByPricingTypeId,
  getPricings,
  getPricingDetailsByPricingId,
  getActiveProductPrice,
};
