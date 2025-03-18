const { query } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Fetches available delivery methods for the dropdown menu.
 * @returns {Promise<Array>} - List of delivery methods (id, name, estimated time).
 */
const getDeliveryMethodsForDropdown = async () => {
  try {
    const queryText = `
      SELECT
          dm.id,
          dm.method_name,
          dm.estimated_time
      FROM delivery_methods dm
      JOIN status s ON dm.status_id = s.id
      WHERE
          dm.is_pickup_location = false
          AND s.name = 'active'
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