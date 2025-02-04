const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const getWarehouses = async ({ page, limit, sortBy, sortOrder }) => {
  const baseQuery = `
    SELECT
        w.id,
        w.name AS warehouse_name,
        l.name AS location_name,
        w.storage_capacity,
        s.name AS status_name,
        w.created_at,
        w.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM warehouses w
    LEFT JOIN locations l ON w.location_id = l.id
    LEFT JOIN status s ON w.status_id = s.id
    LEFT JOIN users u1 ON w.created_by = u1.id
    LEFT JOIN users u2 ON w.updated_by = u2.id
    ORDER BY w.created_at DESC
  `;
};

module.exports = {
  getWarehouses,
};
