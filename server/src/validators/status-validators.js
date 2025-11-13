const Joi = require('joi');
const { validateUUID } = require('./general-validators');

/**
 * Joi schema for validating status updates.
 * Reusable across product, SKU, material, etc.
 */
const updateStatusIdSchema = Joi.object({
  statusId: validateUUID('Status ID'),
});

module.exports = {
  updateStatusIdSchema,
};
