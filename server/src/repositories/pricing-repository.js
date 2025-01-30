const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const getPricingDetailsByPricingTypeId = async ({ pricingTypeId, page, limit}) => {
  const tableName = 'pricing pr';
  const joins = [
    'LEFT JOIN products p ON pr.product_id = p.id',
    'LEFT JOIN locations l ON pr.location_id = l.id',
    'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
    'LEFT JOIN status ps ON pr.status_id = ps.id'
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
    throw new AppError('Failed to fetch pricing details', 500, { originalError: error.message });
  }
};

module.exports = { getPricingDetailsByPricingTypeId };
