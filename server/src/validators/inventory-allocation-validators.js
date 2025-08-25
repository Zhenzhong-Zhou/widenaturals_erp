/**
 * Validation schemas for inventory allocation routes.
 *
 * Includes:
 * - allocateOrderIdSchema: Validates the route parameter `orderId`.
 * - allocateInventorySchema: Validates the request body payload containing
 *   allocation strategy and target warehouse.
 */

const Joi = require('joi');
const { validateString, validateUUID } = require('./general-validators');

/**
 * Validates the body of the inventory allocation request.
 *
 * Fields:
 * - strategy: 4-character allocation strategy (default: 'fefo')
 * - warehouseId: UUID of the warehouse where inventory will be allocated from
 *
 * Example body:
 * {
 *   "strategy": "fefo",
 *   "warehouseId": "123e4567-e89b-12d3-a456-426614174000"
 * }
 */
const allocateInventorySchema = Joi.object({
  strategy: validateString('Strategy', 4, 4).default('fefo'),
  warehouseId: validateUUID('Warehouse ID'),
});

module.exports = {
  allocateInventorySchema,
};
