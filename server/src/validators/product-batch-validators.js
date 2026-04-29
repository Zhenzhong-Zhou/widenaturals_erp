const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  optionalIsoDate,
  validateUUID,
  requiredIsoDate,
  validatePositiveIntegerRequired,
  validateString,
} = require('./general-validators');
const {
  lifecycleStatusUpdateSchema,
  lifecycleReceiveSchema,
  lifecycleNotes,
} = require('./batches/lifecycle-common');

/**
 * Product Batch query schema
 *
 * Validates query parameter shape and types for paginated
 * product batch list endpoints.
 *
 * Includes:
 * - Pagination
 * - Sorting (default: expiry_date)
 * - Product batch lifecycle filters
 * - Product, SKU, and manufacturer filters
 * - Keyword fuzzy search (interpretation deferred to service layer)
 *
 * Explicitly excludes:
 * - Packaging material batches
 * - Polymorphic registry concerns
 * - Visibility or ACL logic
 *
 * IMPORTANT:
 * - Visibility rules (e.g. product batch access, manufacturer exposure)
 *   are enforced in business/service layers
 * - Keyword field eligibility is ACL-governed (NOT client-controlled)
 * - This schema validates input shape and types ONLY
 * - No filtering, visibility, or search logic is applied here
 */
const productBatchQuerySchema = paginationSchema
  .concat(createSortSchema('expiry_date'))
  .keys({
    // --------------------------------------------------
    // Core product batch filters
    // --------------------------------------------------
    statusIds: validateUUIDOrUUIDArrayOptional('Product Batch Status IDs'),

    // --------------------------------------------------
    // Product identity filters
    // --------------------------------------------------
    skuIds: validateUUIDOrUUIDArrayOptional('SKU IDs'),
    productIds: validateUUIDOrUUIDArrayOptional('Product IDs'),
    manufacturerIds: validateUUIDOrUUIDArrayOptional('Manufacturer IDs'),

    // --------------------------------------------------
    // Lot number (explicit, non-keyword)
    // --------------------------------------------------
    lotNumber: validateOptionalString('Lot Number'),

    // --------------------------------------------------
    // Expiry date filters
    // --------------------------------------------------
    expiryAfter: optionalIsoDate('Expiry Date After'),
    expiryBefore: optionalIsoDate('Expiry Date Before'),

    // --------------------------------------------------
    // Manufacturing / receiving lifecycle filters
    // --------------------------------------------------
    manufactureAfter: optionalIsoDate('Manufacture Date After'),
    manufactureBefore: optionalIsoDate('Manufacture Date Before'),
    receivedAfter: optionalIsoDate('Received Date After'),
    receivedBefore: optionalIsoDate('Received Date Before'),

    // --------------------------------------------------
    // Creation audit filters
    // --------------------------------------------------
    createdAfter: optionalIsoDate('Created After'),
    createdBefore: optionalIsoDate('Created Before'),

    // --------------------------------------------------
    // Keyword search (ACL-governed upstream)
    // --------------------------------------------------
    keyword: validateOptionalString(
      'Keyword for fuzzy match (lot, product, SKU, manufacturer)'
    ),
  });

/**
 * Base Joi schema definition for product batch fields.
 *
 * This schema contains the shared validation rules used across
 * multiple product batch operations such as:
 *
 * - batch creation
 * - metadata updates
 * - bulk batch imports
 *
 * Fields defined here represent the editable metadata of a batch.
 *
 * Note:
 * Required/optional constraints are applied in specific schemas
 * (create/edit workflows) using Joi `.fork()`.
 */
const productBatchBaseSchema = {
  // Unique production lot number assigned to the batch
  lot_number: validateString('Lot Number', 10, 100),

  // Manufacturer responsible for producing the batch
  manufacturer_id: validateUUID('Manufacturer'),

  // Production manufacturing date
  manufacture_date: requiredIsoDate(),

  // Expiry date for the batch
  expiry_date: requiredIsoDate(),

  // Initial quantity produced during manufacturing
  initial_quantity: validatePositiveIntegerRequired(),

  // Internal notes for QA, operations, or traceability
  notes: validateOptionalString('Notes', 500),
};

/**
 * Joi schema for validating a single product batch creation payload.
 *
 * Ensures that all required fields for batch creation are present
 * before the request reaches the service layer.
 *
 * Required fields:
 * - sku_id
 * - lot_number
 * - manufacture_date
 * - expiry_date
 * - initial_quantity
 *
 * Optional fields:
 * - manufacturer_id
 * - notes
 * - registryNote
 *
 * Security:
 * - `.unknown(false)` prevents unexpected fields from entering
 *   the application layer.
 *
 * Performance:
 * - Joi validation runs in linear time relative to the number
 *   of validated fields.
 */
const createProductBatchSchema = Joi.object({
  ...productBatchBaseSchema,

  // Each batch must belong to a SKU
  sku_id: validateUUID('SKU ID').required(),
})
  .fork(
    ['lot_number', 'manufacture_date', 'expiry_date', 'initial_quantity'],
    (schema) => schema.required()
  )
  .unknown(false);

/**
 * Joi schema for validating bulk product batch creation requests.
 *
 * Wraps multiple batch records and ensures that:
 *
 * - At least one batch is provided
 * - No more than 200 batches are submitted per request
 *
 * Limiting bulk size prevents excessive validation and database
 * load during large imports.
 *
 * Example request payload:
 *
 * {
 *   "productBatches": [...]
 * }
 *
 * @type {Joi.ObjectSchema}
 */
const createProductBatchBulkSchema = Joi.object({
  productBatches: Joi.array()
    .items(createProductBatchSchema)
    .min(1)
    .max(200)
    .required(),
});

/**
 * Joi schema: Validate Product Batch ID route parameter.
 *
 * Used for routes like:
 *   PATCH /api/v1/product-batches/:batchId/status
 *   PATCH /api/v1/product-batches/:batchId/receive
 *   PATCH /api/v1/product-batches/:batchId/release
 *
 * Ensures the provided product batch ID is a valid UUID.
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = productBatchIdParamSchema.validate(req.params);
 * if (error) throw AppError.validationError(error.message);
 */
const productBatchIdParamSchema = Joi.object({
  batchId: validateUUID('Product Batch ID').description(
    'UUID of the product batch record'
  ),
});

/**
 * Joi schema for editing product batch metadata.
 *
 * Allows partial updates of editable metadata fields while ensuring:
 *
 * - only known fields are accepted
 * - at least one field is provided
 *
 * Required fields from creation become optional here using `.fork()`,
 * allowing flexible metadata updates.
 */
const editProductBatchMetadataSchema = Joi.object(productBatchBaseSchema)
  .fork(Object.keys(productBatchBaseSchema), (schema) => schema.optional())
  .min(1)
  .unknown(false);

//------------------------------------------------------------
// Product batch lifecycle schemas
//------------------------------------------------------------

/**
 * Validation schema for updating the lifecycle status of a product batch.
 *
 * This schema reuses the shared lifecycle status update validator
 * defined in `validators/batches/lifecycle-common.js`.
 *
 * The shared schema ensures that lifecycle status transitions
 * across different batch domains (product batches, packaging
 * material batches, etc.) follow a consistent validation contract.
 *
 * Expected fields are defined by `lifecycleStatusUpdateSchema`,
 * typically including:
 *
 * - status_id : target lifecycle status identifier
 * - notes     : optional lifecycle transition notes
 *
 * @type {Joi.ObjectSchema}
 */
const updateProductBatchStatusSchema = lifecycleStatusUpdateSchema;

/**
 * Validation schema for marking a product batch as received.
 *
 * This schema validates the warehouse intake operation and
 * reuses the shared lifecycle receive validator from
 * `validators/batches/lifecycle-common.js`.
 *
 * The shared validator standardizes fields such as:
 *
 * - received_at : timestamp when the batch was received
 * - notes       : optional intake notes
 *
 * Reusing this schema ensures consistent receive validation
 * behavior across all batch domains.
 *
 * @type {Joi.ObjectSchema}
 */
const receiveProductBatchSchema = lifecycleReceiveSchema;

/**
 * Validation schema for releasing a product batch.
 *
 * Releasing a batch typically represents QA approval or
 * operational authorization allowing the batch to be used
 * in manufacturing, fulfillment, or distribution workflows.
 *
 * Required fields:
 *
 * - manufacturer_id : manufacturer responsible for the release
 *
 * Optional fields:
 *
 * - notes : QA or operational release notes
 *
 * `.unknown(false)` is used to enforce strict validation so that
 * only explicitly defined fields are accepted. This prevents
 * accidental or malicious payload injection.
 *
 * @type {Joi.ObjectSchema}
 */
const releaseProductBatchSchema = Joi.object({
  manufacturer_id: validateUUID('Manufacturer ID').required(),
  notes: lifecycleNotes,
}).unknown(false);

module.exports = {
  productBatchQuerySchema,
  createProductBatchBulkSchema,
  productBatchIdParamSchema,
  editProductBatchMetadataSchema,
  updateProductBatchStatusSchema,
  receiveProductBatchSchema,
  releaseProductBatchSchema,
};
