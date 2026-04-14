/**
 * @file warehouse-inventory-validators.js
 * @description
 * Joi validation schema for warehouse inventory query parameters.
 *
 * Extends the shared pagination and sort schemas with inventory-specific
 * filters: batch type, status, SKU, product, packaging material, inbound
 * date range, reserved quantity flag, and keyword search.
 *
 * Exports:
 *  - warehouseInventoryQuerySchema
 */

'use strict';

const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateOptionalUUID,
  optionalIsoDate,
  validateOptionalString
} = require('./general-validators');

const warehouseInventoryQuerySchema = paginationSchema
  .concat(createSortSchema('inboundDate'))
  .keys({
    // --------------------------------------------------
    // Batch-type filter
    // --------------------------------------------------
    batchType: Joi.string()
      .valid('product', 'packaging_material')
      .optional()
      .messages({
        'string.base':  'Batch Type must be a string.',
        'any.only':     'Batch Type must be one of: product, packaging_material.',
      }),
    
    // --------------------------------------------------
    // Inventory status filter
    // --------------------------------------------------
    statusId: validateOptionalUUID('Inventory Status ID'),
    
    // --------------------------------------------------
    // Product batch filters
    // --------------------------------------------------
    skuId:     validateOptionalUUID('SKU ID'),
    productId: validateOptionalUUID('Product ID'),
    
    // --------------------------------------------------
    // Packaging batch filter
    // --------------------------------------------------
    packagingMaterialId: validateOptionalUUID('Packaging Material ID'),
    
    // --------------------------------------------------
    // Inbound date range
    // --------------------------------------------------
    inboundDateAfter:  optionalIsoDate('Inbound Date After'),
    inboundDateBefore: optionalIsoDate('Inbound Date Before'),
    
    // --------------------------------------------------
    // Reserved quantity boolean filter
    // --------------------------------------------------
    hasReserved: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Has Reserved must be a boolean.',
      }),
    
    // --------------------------------------------------
    // Keyword search (ACL-governed upstream)
    // --------------------------------------------------
    search: validateOptionalString(
      'Search across lot number, product name, SKU, material code'
    ),
  });

module.exports = {
  warehouseInventoryQuerySchema,
};
