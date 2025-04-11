const { getStatusIdByName } = require('../repositories/status-repository');
const { validateCustomer } = require('../validators/customer-validator');
const AppError = require('../utils/AppError');

/**
 * Prepares customer data by validating and enriching it with default fields.
 * @param {Array} customers - Array of customer objects.
 * @param {String} createdBy - ID of the user creating the records.
 * @returns {Promise<Array>} - Validated and transformed customers.
 * @throws {AppError} - Throws validation or database error.
 */
const prepareCustomersForInsert = async (customers, createdBy) => {
  try {
    if (!Array.isArray(customers) || customers.length === 0) {
      throw AppError.validationError('Customer list is empty.');
    }

    const activeStatusId = await getStatusIdByName('active');
    if (!activeStatusId) {
      throw AppError.notFoundError('Active status ID not found.');
    }

    await Promise.all(customers.map(validateCustomer));

    return customers.map((customer) => ({
      ...customer,
      status_id: activeStatusId,
      created_by: createdBy,
      updated_by: createdBy,
    }));
  } catch (error) {
    throw AppError.businessError(
      'Failed to prepare customers for insert',
      error
    );
  }
};

module.exports = { prepareCustomersForInsert };
