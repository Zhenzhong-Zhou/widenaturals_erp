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
    
    logInfo(`Successfully fetched ${result.data.length} price types on page ${page}.`);
    return result;
  } catch (error) {
    logError('Error fetching price types:', error);
    throw new AppError('Failed to fetch price types', 500, error);
  }
};

const getPricingDetailsByPricingTypeId = async ({ pricingTypeId, page, limit }) => {
  const tableName = 'pricing pr';
  const joins = [
    'LEFT JOIN pricing_types pt ON pt.id = pr.price_type_id',
    'LEFT JOIN products p ON pr.product_id = p.id',
    'LEFT JOIN locations l ON pr.location_id = l.id',
    'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
    'LEFT JOIN status s ON pr.status_id = s.id',
  ];
  const whereClause = 'pr.price_type_id = $1'; // Ensures no filtering
  
  // Fetch paginated pricing details
  const baseQuery = `
    SELECT
      pt.id AS pricing_type_id,
      pt.name AS pricing_type_name,
      pt.description AS pricing_type_description,
      pt.created_at AS pricing_type_created_at,
      pt.updated_at AS pricing_type_updated_at,
      pr.id AS pricing_id,
      pr.price,
      pr.valid_from,
      pr.valid_to,
      pr.status_date,
      p.id AS product_id,
      p.product_name,
      p.series,
      p.brand,
      p.category,
      p.barcode,
      p.market_region,
      l.id AS location_id,
      l.name AS location_name,
      lt.name AS location_type_name,
      s.name AS pricing_status_name
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
  `;
  
  try {
      // Execute the paginated query with retry logic
    return await retry(
       () =>
         paginateQuery({
           tableName,
           joins,
           whereClause,
           queryText: baseQuery,
           params: [pricingTypeId],
           page,
           limit,
           sortBy: 'p.product_name',
           sortOrder: 'ASC',
         }),
       3 // Retry up to 3 times
     );
  } catch (error) {
    throw new AppError('Failed to fetch pricing details', 500, { originalError: error.message });
  }
};

module.exports = {
  getAllPriceTypes,
  getPricingDetailsByPricingTypeId,
};
