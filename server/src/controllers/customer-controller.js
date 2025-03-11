const { createCustomers } = require('../services/customer-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');
const { getUser } = require('../repositories/user-repository');

/**
 * Handles creating a single customer or multiple customers.
 * Determines if the request is for bulk or single insert based on input type.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next function.
 */
const createCustomerController = wrapAsync(async (req, res, next) => {
  try {
    let customers = req.body;
    // const createdBy = req.user.id; // Extract user from token
    
    const responseUser = await getUser(null, 'email', 'root@widenaturals.com');
    const userId = responseUser.id;
    
    if (!Array.isArray(customers) && typeof customers !== 'object') {
      throw AppError.validationError('Invalid input: Expected an object or an array of objects.');
    }
    
    let result;
    if (Array.isArray(customers)) {
      // 🔹 Bulk Insert
      result = await createCustomers(customers, userId);
      res.status(201).json({ success: true, message: 'Bulk customers created successfully.', customers: result });
    } else {
      // 🔹 Single Insert
      result = await createCustomers(customers, userId);
      res.status(201).json({ success: true, message: 'Customer created successfully.', customer: result });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

module.exports = {
  createCustomerController,
};
