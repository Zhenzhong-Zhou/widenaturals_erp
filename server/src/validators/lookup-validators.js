const Joi = require('joi');
const {
  validateUUID,
  validateOptionalUUID,
  createBooleanFlag,
  validateKeyword,
} = require('./general-validators');

/**
 * Base Joi schema for validating common lookup query parameters.
 *
 * This base schema defines reusable validation rules for keyword search,
 * pagination limit, and offset. It can be extended or wrapped by specific
 * lookup schemas (e.g., customer, batch, material).
 *
 * Fields:
 * - keyword: Optional string keyword for partial match search (max 100 characters).
 * - limit: Optional integer for number of records to return (default 50, max 100).
 * - offset: Optional integer for pagination offset (default 0, min 0).
 *
 * @type {Object}
 */
const baseLookupQuerySchema = {
  keyword: validateKeyword('Keyword'),
  limit: Joi.number().integer().min(1).max(100).default(50).label('Limit'),
  offset: Joi.number().integer().min(0).default(0).label('Offset'),
};

/**
 * Joi schema for validating batch registry lookup query parameters.
 *
 * Inherits base lookup options and adds:
 * - batchType: 'product' | 'packaging_material' (optional)
 * - warehouseId: UUID (optional)
 * - locationId: UUID (optional)
 */
const batchRegistryLookupQuerySchema = Joi.object({
  batchType: Joi.string()
    .valid('product', 'packaging_material')
    .optional()
    .allow('', null)
    .label('Batch Type'),

  warehouseId: validateUUID('Warehouse ID').optional().allow('', null),
  locationId: validateUUID('Location ID').optional().allow('', null),

  ...baseLookupQuerySchema,
});

/**
 * Schema for validating warehouse lookup query parameters.
 */
const warehouseLookupQuerySchema = Joi.object({
  warehouseTypeId: validateOptionalUUID('Warehouse Type ID'),
});

/**
 * Validation schema for querying lot adjustment types in lookup endpoints.
 *
 * Supported Query Parameters:
 * - excludeInternal (boolean, optional): If true, excludes internal/system-only adjustment types.
 * - restrictToQtyAdjustment (boolean, optional): If true, only includes adjustment types that affect quantity.
 *
 * These flags are typically used to customize dropdown options in inventory-related forms.
 */
const lotAdjustmentTypeLookupSchema = Joi.object({
  excludeInternal: createBooleanFlag('Exclude Internal Types'),
  restrictToQtyAdjustment: createBooleanFlag(
    'Restrict to Quantity Adjustments'
  ),
});

/**
 * Joi validation schema for customer lookup query parameters.
 *
 * This schema validates and normalizes the query parameters used
 * for customer lookup endpoints (e.g., dropdowns or autocomplete).
 *
 * @type {import('joi').ObjectSchema}
 *
 * @example
 * const { error, value } = customerLookupQuerySchema.validate(req.query);
 * if (error) throw AppError.validationError(error.details.map(d => d.message).join(', '));
 * // value = { keyword: 'john', limit: 50, offset: 0 }
 */
const customerLookupQuerySchema = Joi.object(baseLookupQuerySchema);

/**
 * Joi schema to validate query parameters for customer address lookup.
 *
 * Ensures `customerId` is present and formatted as a valid UUID.
 * This schema is used in the GET /addresses/by-customer route
 * to validate the input before querying for address lookup data.
 *
 * Example:
 *   GET /addresses/by-customer?customerId=abc123
 *
 * @returns {Joi.ObjectSchema} Joi validation schema for the customer lookup query.
 */
const customerAddressLookupQuerySchema = Joi.object({
  customerId: validateUUID('customerId'),
});

/**
 * Validation schema for order type lookup query parameters.
 *
 * This schema ensures the optional `keyword` is a trimmed string
 * and follows the constraints defined in `validateKeyword`.
 * Used to filter order types by name or code.
 *
 * Example:
 *   /api/lookups/order-types?keyword=sale
 */
const orderTypeLookupQuerySchema = Joi.object({
  keyword: validateKeyword('Order Types Keyword'),
});

/**
 * Joi schema for validating query parameters for the payment method lookup endpoint.
 *
 * This schema is composed using the shared `baseLookupQuerySchema`, and is used to validate and
 * sanitize input for:
 *   - GET /lookups/payment-methods
 *
 * Fields (inherited from baseLookupQuerySchema):
 * @property {string} [keyword] - Optional search keyword for matching payment method name or code.
 *   Validated using `validateKeyword()` to enforce length, format, and sanitization rules.
 *
 * @property {number} [limit=50] - Number of records to return per page. Must be between 1 and 100.
 *
 * @property {number} [offset=0] - Number of records to skip. Must be zero or greater.
 *
 * Example usage:
 *   GET /lookups/payment-methods?keyword=paypal&limit=20&offset=40
 *
 * Used by:
 * - Query validation middleware before reaching the controller.
 */
const paymentMethodLookupQuerySchema = Joi.object({
  ...baseLookupQuerySchema,
});

/**
 * Joi validation schema for discount lookup query parameters.
 *
 * Validates GET requests to the `/lookups/discounts` endpoint.
 * Only supports:
 * - `filters.keyword`: Optional string for name/description search
 * - `limit`: Optional number for pagination (default 50)
 * - `offset`: Optional number for pagination offset (default 0)
 *
 * All fields are inherited from `baseLookupQuerySchema`.
 *
 * @type {Joi.ObjectSchema}
 */
const discountLookupQuerySchema = Joi.object({
  ...baseLookupQuerySchema,
});

/**
 * Joi validation schema for tax rate lookup query parameters.
 *
 * Validates GET requests to the `/lookups/tax-rates` endpoint.
 * Only supports:
 * - `filters.keyword`: Optional string for name/province search
 * - `limit`: Optional number for pagination (default 50)
 * - `offset`: Optional number for pagination offset (default 0)
 *
 * All fields are inherited from `baseLookupQuerySchema`.
 *
 * @type {Joi.ObjectSchema}
 */
const taxRateLookupQuerySchema = Joi.object({
  ...baseLookupQuerySchema,
});

/**
 * Joi validation schema for delivery method lookup query parameters.
 *
 * Validates GET requests to the `/lookups/delivery-methods` endpoint.
 * Inherits:
 * - `filters.keyword`: Optional string for name/description search
 * - `limit`: Optional number for pagination (default 50)
 * - `offset`: Optional number for pagination offset (default 0)
 *
 * Additional supported filter:
 * - `isPickupLocation`: Optional boolean to filter by pickup availability
 *
 * @type {Joi.ObjectSchema}
 */
const deliveryMethodLookupQuerySchema = Joi.object({
  isPickupLocation: createBooleanFlag('Is Pickup Location'),
  ...baseLookupQuerySchema,
});

/**
 * Joi validation schema for SKU lookup query parameters.
 *
 * Validates GET requests to the `/lookups/skus` endpoint.
 * Inherits:
 * - `filters.keyword`: Optional string for name/code/barcode search
 * - `limit`: Optional number for pagination (default: 50)
 * - `offset`: Optional number for pagination offset (default: 0)
 *
 * Additional supported option:
 * - `includeBarcode`: Optional boolean to control label formatting (e.g., show barcode)
 *
 * @type {Joi.ObjectSchema}
 */
const skuLookupQuerySchema = Joi.object({
  includeBarcode: createBooleanFlag('Include Barcode in Label'),
  ...baseLookupQuerySchema,
});

module.exports = {
  batchRegistryLookupQuerySchema,
  warehouseLookupQuerySchema,
  lotAdjustmentTypeLookupSchema,
  customerLookupQuerySchema,
  customerAddressLookupQuerySchema,
  orderTypeLookupQuerySchema,
  paymentMethodLookupQuerySchema,
  discountLookupQuerySchema,
  taxRateLookupQuerySchema,
  deliveryMethodLookupQuerySchema,
  skuLookupQuerySchema,
};
