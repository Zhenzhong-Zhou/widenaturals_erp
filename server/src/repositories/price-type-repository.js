const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');

const getAllPriceTypes = async ({ page, limit, filters }) => {
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
  
  const whereClauses = [];
  const params = [];
  
  try {
    
    if (filters.name) {
      whereClauses.push(`pt.name ILIKE $${params.length + 1}`);
      params.push(`%${filters.name}%`);
    }
    
    if (filters.status) {
      whereClauses.push(`s.name = $${params.length + 1}`);
      params.push(filters.status);
    }
    
    const whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Execute the paginated query with retry logic
    const result = await retry(
      () =>
        paginateQuery({
          queryText: `${baseQuery} ${whereClause}`,
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

module.exports = {
  getAllPriceTypes,
};
