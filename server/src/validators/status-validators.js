const Joi = require('joi');
const { validateUUID } = require('./general-validators');

/**
 * Joi schema for updating product status.
 * Ensures request body contains a valid `statusId`.
 */
const updateProductStatusSchema = Joi.object({
  statusId: validateUUID('Status ID'),
});

module.exports = {
  updateProductStatusSchema,
};
