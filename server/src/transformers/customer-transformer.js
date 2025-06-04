const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Formats a full address from individual components.
 *
 * @param {Object} row - Raw DB row with address parts.
 * @returns {string} - Formatted address string.
 */
const formatAddress = (row) => {
  const parts = [
    row.address_line1,
    row.address_line2,
    row.city,
    row.state,
    row.postal_code,
    row.country,
    row.region,
  ].filter(Boolean); // remove null/undefined
  return parts.join(', ');
};

/**
 * Transforms a raw database row into a structured customer details object.
 *
 * @param {Object} row - Raw row returned from the database query.
 * @returns {Object} Transformed customer details.
 * @throws Will throw an AppError if transformation fails.
 */
const transformCustomerDetails = (row) => {
  try {
    return {
      id: row.id,
      customerName: row.customer_name || 'Unknown',
      email: row.email,
      phoneNumber: row.phone_number,
      address: formatAddress(row),
      note: row.note || null,
      statusId: row.status_id,
      statusName: row.status_name,
      statusDate: row.status_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || 'Unknown',
      updatedBy: row.updated_by || 'Unknown',
    };
  } catch (error) {
    logError('Failed to transform customer details:', error.message);
    throw AppError.transformerError('Data transformation error');
  }
};

module.exports = {
  transformCustomerDetails,
};
