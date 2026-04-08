const Joi = require('joi');
const {
  validateOptionalUUID,
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema, validateUUID
} = require('./general-validators');

const pricingTypeParamsSchema = Joi.object({
  pricingTypeId: validateUUID('Pricing Type ID')
    .description('UUID of the pricing type record'),
});


const pricingTypeQuerySchema = paginationSchema
  .concat(createSortSchema('pricingTypeName'))
  .concat(createdDateRangeSchema)
  .concat(Joi.object({
    search:        Joi.string().max(100).optional(),
    statusId:      validateOptionalUUID('Status ID'),
    createdBy:     validateOptionalUUID('Created By'),
    updatedBy:     validateOptionalUUID('Updated By'),
  }));

module.exports = {
  pricingTypeParamsSchema,
  pricingTypeQuerySchema
};
