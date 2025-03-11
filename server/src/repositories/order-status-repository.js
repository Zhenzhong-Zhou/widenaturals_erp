const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

const getStatusByCodeOrId = async ({ id, code }, client) => {
  if (!id && !code) {
    throw AppError.validationError('Either status ID or code is required.');
  }
  
  const statusQuery = `
    SELECT id, code FROM order_status
    WHERE (id = COALESCE($1, id::uuid))
      OR (code = COALESCE($2, code))
    LIMIT 1;
  `;
  
  try {
    const { rows } = await client.query(statusQuery, [id || null, code || null]);
    return rows.length ? rows[0] : null; // ✅ Returns { id, code } or null
  } catch (error) {
    logError(`Error fetching status:`, error);
    throw AppError.databaseError('Failed to fetch status.');
  }
};

module.exports = {
  getStatusByCodeOrId,
}
