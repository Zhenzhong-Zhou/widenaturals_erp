/**
 * @file inventory-activity-log-validators.js
 * @description
 * Joi validation schema for inventory activity log query parameters.
 *
 * Extends the shared pagination and sort schemas with log-specific
 * filters: inventory record, action type, adjustment type, reference
 * type, performer, and performed-at date range.
 *
 * Exports:
 *  - inventoryActivityLogQuerySchema
 */

'use strict';

const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateOptionalUUID,
  optionalIsoDate,
} = require('./general-validators');

const inventoryActivityLogQuerySchema = paginationSchema
  .concat(createSortSchema('performedAt'))
  .keys({
    inventoryId: validateOptionalUUID('Inventory ID'),
    actionTypeId: validateOptionalUUID('Action Type ID'),
    adjustmentTypeId: validateOptionalUUID('Adjustment Type ID'),
    referenceType: Joi.string()
      .valid('order', 'transfer', 'audit', 'return', 'manual')
      .optional()
      .messages({
        'string.base': 'Reference Type must be a string.',
        'any.only':
          'Reference Type must be one of: order, transfer, audit, return, manual.',
      }),
    performedBy: validateOptionalUUID('Performed By'),
    performedAtAfter: optionalIsoDate('Performed At After'),
    performedAtBefore: optionalIsoDate('Performed At Before'),
  });

module.exports = {
  inventoryActivityLogQuerySchema,
};
