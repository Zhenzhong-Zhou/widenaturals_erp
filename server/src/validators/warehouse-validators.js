/**
 * @file warehouse-validators.js
 * @description
 * Joi validation schemas for warehouse route parameters.
 *
 * Exports:
 *  - warehouseIdParamSchema — warehouseId route param validation
 */

'use strict';

const Joi = require('joi');
const { validateUUID } = require('./general-validators');

// ── Param schema ────────────────────────────────────────────────────

const warehouseIdParamSchema = Joi.object({
  warehouseId: validateUUID('Warehouse ID').required(),
}).unknown(false);

module.exports = {
  warehouseIdParamSchema,
};
