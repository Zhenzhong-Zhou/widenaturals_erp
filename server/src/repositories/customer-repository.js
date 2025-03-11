const { withTransaction, bulkInsert, query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Checks if a customer exists by email or phone.
 * @param {string} email - Customer email.
 * @param {string} phone_number - Customer phone number.
 * @returns {Promise<boolean>} - True if customer exists, otherwise false.
 */
const checkCustomerExists = async (email, phone_number) => {
  if (!email && !phone_number) return false;
  
  const sql = `
    SELECT id FROM customers
    WHERE email = $1 OR phone_number = $2
    LIMIT 1;
  `;
  
  const result = await query(sql, [email || null, phone_number || null]);
  return result.rows.length > 0;
};

/**
 * Inserts multiple customers into the database in a transaction.
 * @param {Array} customers - List of customer objects.
 * @returns {Promise<Array>} - The inserted customers.
 */
const bulkCreateCustomers = async (customers) => {
  if (!Array.isArray(customers) || customers.length === 0) {
    throw AppError('Customer list is empty.', 400, { code: 'VALIDATION_ERROR' });
  }
  
  const columns = [
    'firstname', 'lastname', 'email', 'phone_number', 'address',
    'status_id', 'note', 'status_date', 'created_at', 'updated_at',
    'created_by', 'updated_by'
  ];
  
  const rows = customers.map((customer) => [
    customer.firstname,
    customer.lastname,
    customer.email || null,
    customer.phone_number || null,
    customer.address || null,
    customer.status_id,
    customer.note || null,
    new Date(), // status_date
    new Date(), // created_at
    null, // updated_at
    customer.created_by,
    null,
  ]);
  
  return withTransaction(async (client) => {
    try {
      return await bulkInsert(
        'customers',
        columns,
        rows,
        ['email', 'phone_number'], // Conflict resolution based on email, phone
        ['firstname', 'lastname', 'address', 'status_id', 'updated_at'], // Update on conflict
        client
      );
    } catch (error) {
      logError('❌ Bulk Insert Failed:', error);
      throw AppError('Bulk insert operation failed',{
        details: { tableName: 'customers', columns, error: error.message },
      });
    }
  });
};

module.exports = { checkCustomerExists, bulkCreateCustomers };
