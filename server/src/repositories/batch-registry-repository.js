const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Fetches a batch_registry row by its ID.
 *
 * @param {string} batchRegistryId - UUID of the batch_registry row.
 * @param {object} client - pg client or pool instance.
 * @returns {Promise<object|null>} - The row { id, batch_type } or null if not found.
 * @throws {AppError} - On query failure.
 */
const getBatchRegistryById = async (batchRegistryId, client) => {
  const sql = `
    SELECT id, batch_type
    FROM batch_registry
    WHERE id = $1
    LIMIT 1
  `;
  
  try {
    const { rows } = await query(sql, [batchRegistryId], client);
    return rows[0] || null;
  } catch (error) {
    logSystemException(error, 'Failed to fetch batch_registry by ID', {
      context: 'batch-registry-repository/getBatchRegistryById',
      batchRegistryId,
    });
    
    throw AppError.databaseError('Failed to fetch batch_registry entry', {
      details: error.message,
    });
  }
};

module.exports = {
  getBatchRegistryById,
};
