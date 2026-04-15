/**
 * @file warehouse-inventory-validators.js
 * @description
 * Joi validation schemas for warehouse inventory endpoints.
 *
 * Covers query parameter validation for the paginated list, route param
 * validation for single-record endpoints, and request body validation
 * for bulk create, quantity adjustment, status update, metadata update,
 * and outbound recording operations.
 *
 * Exports:
 *  - inventoryIdParamSchema                    — warehouseId + inventoryId route params
 *  - warehouseInventoryQuerySchema             — paginated list query filters and sort
 *  - createWarehouseInventoryBulkSchema        — bulk inventory record creation body
 *  - adjustWarehouseInventoryQuantitySchema    — bulk quantity adjustment body
 *  - updateWarehouseInventoryStatusSchema      — bulk status update body
 *  - updateWarehouseInventoryMetadataSchema    — single metadata patch body
 *  - recordWarehouseInventoryOutboundSchema    — bulk outbound recording body
 *  - warehouseItemSummaryQuerySchema           — batch-type filter schema for warehouse item summary
 */

'use strict';

const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateOptionalUUID,
  optionalIsoDate,
  validateOptionalString,
  validateUUID,
  validatePositiveIntegerRequired,
  requiredIsoDate
} = require('./general-validators');

// ── Param schema ────────────────────────────────────────────────────

const inventoryIdParamSchema = Joi.object({
  warehouseId: validateUUID('Warehouse ID').required(),
  inventoryId: validateUUID('Inventory ID').required(),
}).unknown(true);

// ── Query schema (GET list) ─────────────────────────────────────────

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

// ── Body schema (POST create) ───────────────────────────────────────

const createWarehouseInventoryRecordSchema = Joi.object({
  batchId:           validateUUID('Batch Registry ID'),
  warehouseQuantity: validatePositiveIntegerRequired(),
  warehouseFee:      Joi.number()
    .precision(2)
    .min(0)
    .optional()
    .messages({
      'number.base': 'Warehouse Fee must be a number.',
      'number.min':  'Warehouse Fee must be zero or greater.',
    }),
  inboundDate:       optionalIsoDate('Inbound Date'),
  statusId:          validateUUID('Inventory Status ID').optional(),
}).unknown(false);

const createWarehouseInventoryBulkSchema = Joi.object({
  records: Joi.array()
    .items(createWarehouseInventoryRecordSchema)
    .min(1)
    .max(200)
    .required()
    .messages({
      'array.min': 'At least one inventory record is required.',
      'array.max': 'Cannot exceed 200 records per request.',
    }),
}).unknown(false);

// ── Body schema (PATCH quantities) ──────────────────────────────────

const adjustQuantityItemSchema = Joi.object({
  id:                validateUUID('Inventory ID').required(),
  warehouseQuantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base':    'Warehouse Quantity must be a number.',
      'number.integer': 'Warehouse Quantity must be an integer.',
      'number.min':     'Warehouse Quantity must be zero or greater.',
      'any.required':   'Warehouse Quantity is required.',
    }),
  reservedQuantity: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.base':    'Reserved Quantity must be a number.',
      'number.integer': 'Reserved Quantity must be an integer.',
      'number.min':     'Reserved Quantity must be zero or greater.',
    }),
}).unknown(false);

const adjustWarehouseInventoryQuantitySchema = Joi.object({
  updates: Joi.array()
    .items(adjustQuantityItemSchema)
    .min(1)
    .max(200)
    .required()
    .messages({
      'array.min': 'At least one quantity adjustment is required.',
      'array.max': 'Cannot exceed 200 adjustments per request.',
    }),
}).unknown(false);

// ── Body schema (PATCH statuses) ────────────────────────────────────

const updateStatusItemSchema = Joi.object({
  id:       validateUUID('Inventory ID').required(),
  statusId: validateUUID('Inventory Status ID').required(),
}).unknown(false);

const updateWarehouseInventoryStatusSchema = Joi.object({
  updates: Joi.array()
    .items(updateStatusItemSchema)
    .min(1)
    .max(200)
    .required()
    .messages({
      'array.min': 'At least one status update is required.',
      'array.max': 'Cannot exceed 200 status updates per request.',
    }),
}).unknown(false);

// ── Body schema (PATCH metadata) ────────────────────────────────────

const updateWarehouseInventoryMetadataSchema = Joi.object({
  inboundDate: optionalIsoDate('Inbound Date'),
  warehouseFee: Joi.number()
    .precision(2)
    .min(0)
    .optional()
    .messages({
      'number.base': 'Warehouse Fee must be a number.',
      'number.min':  'Warehouse Fee must be zero or greater.',
    }),
}).or('inboundDate', 'warehouseFee')
  .unknown(false)
  .messages({
    'object.missing': 'At least one of Inbound Date or Warehouse Fee is required.',
  });

// ── Body schema (POST outbound) ─────────────────────────────────────

const outboundItemSchema = Joi.object({
  id:                validateUUID('Inventory ID').required(),
  outboundDate:      requiredIsoDate('Outbound Date'),
  warehouseQuantity: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base':    'Warehouse Quantity must be a number.',
      'number.integer': 'Warehouse Quantity must be an integer.',
      'number.min':     'Warehouse Quantity must be zero or greater.',
      'any.required':   'Warehouse Quantity is required.',
    }),
}).unknown(false);

const recordWarehouseInventoryOutboundSchema = Joi.object({
  updates: Joi.array()
    .items(outboundItemSchema)
    .min(1)
    .max(200)
    .required()
    .messages({
      'array.min': 'At least one outbound record is required.',
      'array.max': 'Cannot exceed 200 outbound records per request.',
    }),
}).unknown(false);

// ── Query schema (GET summary/items) ───────────────────────────────

const warehouseItemSummaryQuerySchema = Joi.object({
  batchType: Joi.string()
    .valid('product', 'packaging_material')
    .optional()
    .messages({
      'string.base': 'Batch Type must be a string.',
      'any.only':    'Batch Type must be one of: product, packaging_material.',
    }),
}).unknown(false);

module.exports = {
  inventoryIdParamSchema,
  warehouseInventoryQuerySchema,
  createWarehouseInventoryBulkSchema,
  adjustWarehouseInventoryQuantitySchema,
  updateWarehouseInventoryStatusSchema,
  updateWarehouseInventoryMetadataSchema,
  recordWarehouseInventoryOutboundSchema,
  warehouseItemSummaryQuerySchema,
};
