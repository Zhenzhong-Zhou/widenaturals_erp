const Joi = require('joi');
const { paginationSchema, createSortSchema, createdDateRangeSchema, validateOptionalUUID, validateKeyword,
  createBooleanFlag, optionalIsoDate
} = require('./general-validators');

// ─── Group List ───────────────────────────────────────────────────────────────

const pricingGroupQuerySchema = paginationSchema
  .concat(createSortSchema('pricingTypeName'))
  .concat(createdDateRangeSchema)
  .concat(Joi.object({
    pricingTypeId:  validateOptionalUUID('Pricing Type ID'),
    statusId:       validateOptionalUUID('Status ID'),
    countryCode:    Joi.string().max(10).optional(),
    priceMin:       Joi.number().precision(2).min(0).optional(),
    priceMax:       Joi.number().precision(2).min(0).optional(),
    validFrom:      optionalIsoDate(),
    validTo:        optionalIsoDate(),
    validOn:        optionalIsoDate(),
    skuId:          validateOptionalUUID('SKU ID'),
    productId:      validateOptionalUUID('Product ID'),
    keyword:        validateKeyword('Keyword'),
    currentlyValid: createBooleanFlag('currentlyValid'),
    createdBy:      validateOptionalUUID('Created By'),
    updatedBy:      validateOptionalUUID('Updated By'),
  }));

// ─── SKU List ─────────────────────────────────────────────────────────────────

const pricingSkuQuerySchema = paginationSchema
  .concat(createSortSchema('productName'))
  .concat(Joi.object({
    search:      Joi.string().max(100).optional(),
    brand:       Joi.string().max(100).optional(),
    category:    Joi.string().max(100).optional(),
    productId:   validateOptionalUUID('Product ID'),
    skuId:       validateOptionalUUID('SKU ID'),
    countryCode: Joi.string().max(10).optional(),
  }));

module.exports = {
  pricingGroupQuerySchema,
  pricingSkuQuerySchema,
};
