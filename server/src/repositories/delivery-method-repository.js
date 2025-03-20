const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Fetches available delivery methods for the dropdown menu.
 * @param {boolean} includePickup - Whether to include In-Store Pickup methods.
 * @returns {Promise<Array<{ id: string, name: string, estimatedTime: { days: number } }>>} - List of delivery methods.
 */
const getDeliveryMethodsForDropdown = async (includePickup = false) => {
  try {
    const queryText = `
      SELECT
          dm.id,
          dm.method_name AS name,
          dm.estimated_time AS estimatedTime
      FROM delivery_methods dm
      JOIN status s ON dm.status_id = s.id
      WHERE
          s.name = 'active'
          ${!includePickup ? 'AND dm.is_pickup_location = false' : ''}
      ORDER BY dm.method_name ASC;
    `;
    
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching delivery methods:', error);
    throw AppError.databaseError('Failed to fetch delivery methods');
  }
};

/**
 * Repository function to check if a delivery method exists by ID.
 * @param {string} deliveryMethodId - The UUID of the delivery method.
 * @param {object} client - Database transaction client (optional for transactions).
 * @returns {Promise<boolean>} - Returns true if the delivery method exists, otherwise false.
 */
const checkDeliveryMethodExists = async (deliveryMethodId, client = null) => {
  try {
    const queryText = `
      SELECT EXISTS (
        SELECT 1 FROM delivery_methods WHERE id = $1
      ) AS exists;
    `;
    
    const { rows } = client
      ? await client.query(queryText, [deliveryMethodId])
      : await query(queryText, [deliveryMethodId]);
    
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking delivery method existence:', error);
    throw AppError.databaseError('Failed to check delivery method existence');
  }
};

module.exports = {
  getDeliveryMethodsForDropdown,
  checkDeliveryMethodExists
}