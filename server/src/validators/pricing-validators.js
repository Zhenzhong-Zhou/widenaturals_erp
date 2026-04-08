'use strict';

const Joi = require('joi');
const {
  validateOptionalUUID,
  validateUUID,
} = require('./general-validators');

// ─── Params ───────────────────────────────────────────────────────────────────

const pricingGroupParamsSchema = Joi.object({
  pricingGroupId: validateUUID('Pricing Group ID')
    .description('UUID of the pricing group record'),
});

// ─── Export ───────────────────────────────────────────────────────────────────

const pricingExportQuerySchema = Joi.object({
  pricingTypeId: validateOptionalUUID('Pricing Type ID'),
  countryCode:   Joi.string().max(10).optional(),
  statusId:      validateOptionalUUID('Status ID'),
  brand:         Joi.string().max(100).optional(),
  productId:     validateOptionalUUID('Product ID'),
  exportFormat:  Joi.string().valid('csv', 'xlsx').default('xlsx'),
});

module.exports = {
  pricingGroupParamsSchema,
  pricingExportQuerySchema,
};
