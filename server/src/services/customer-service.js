const AppError = require('../utils/AppError');
const {
  insertCustomerRecords,
  getEnrichedCustomersByIds,
} = require('../repositories/customer-repository');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const { prepareCustomersForInsert } = require('../shared/customer-utils');
const { withTransaction } = require('../database/db');
const {
  transformEnrichedCustomers,
} = require('../transformers/customer-transformer');
const { filterCustomerForViewer } = require('../business/customer-business');

/**
 * Creates multiple customers in bulk with validation and conflict handling.
 * Wraps the insertion in a database transaction to ensure atomicity.
 *
 * - Validates and enriches customer data (status, created_by, etc.)
 * - Uses `ON CONFLICT` upsert behavior on email + phone_number
 * - Returns inserted or updated customer records (filtered by permission)
 *
 * @param {Array<Object>} customers - List of raw customer objects to insert
 * @param {Object} user - Authenticated user object with role and id
 * @param {string} [purpose='insert_response'] - Use-case-specific filtering key
 * @returns {Promise<Array<Object>>} - Filtered inserted/enriched customer records
 * @throws {AppError} - Wrapped service-level error
 */
const createCustomersService = async (customers, user, purpose = 'insert_response') => {
  if (!Array.isArray(customers) || customers.length === 0) {
    throw AppError.validationError(
      'Input must be a non-empty array of customer objects.'
    );
  }
  
  if (customers.length > 20) {
    throw AppError.validationError(
      'Cannot insert more than 20 customers at once.'
    );
  }
  
  const createdBy = user.id;
  
  return withTransaction(async (client) => {
    try {
      logSystemInfo('Preparing customer data for insert', {
        count: customers.length,
        context: 'customer-service/createCustomers',
      });
      
      const preparedCustomers = await prepareCustomersForInsert(
        customers,
        createdBy
      );
      
      const inserted = await insertCustomerRecords(preparedCustomers, client);
      
      if (!Array.isArray(inserted) || inserted.length === 0) {
        throw AppError.databaseError('No customer records were inserted.');
      }
      
      const insertedIds = inserted.map((row) => row.id);
      
      logSystemInfo('Customer bulk insert completed', {
        insertedCount: inserted.length,
        context: 'customer-service/createCustomers',
      });
      
      const rawResult = await getEnrichedCustomersByIds(insertedIds, client);
      const enrichedRecords = transformEnrichedCustomers(rawResult);

      return enrichedRecords.map((customer) =>
        filterCustomerForViewer(customer, user, purpose)
      );
    } catch (error) {
      logSystemException(error, 'Failed to create customers in transaction', {
        customerCount: customers?.length,
        requestedBy: createdBy,
        context: 'customer-service/createCustomers',
      });
      
      throw AppError.serviceError(
        'Failed to create customers in transaction',
        error
      );
    }
  });
};

module.exports = {
  createCustomersService,
};
