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
    [
      'lot_number',
      'manufacture_date',
      'expiry_date',
      'initial_quantity',
    ],
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
const editProductBatchMetadataSchema = Joi.object(
    productBatchBaseSchema
  )
  .fork(
    Object.keys(productBatchBaseSchema),
    (schema) => schema.optional()
  )
  .min(1)
  .unknown(false);

/**
 * Joi schema for updating product batch lifecycle status.
 *
 * This schema is used for lifecycle transitions such as:
 *
 * - pending → received
 * - received → released
 *
 * Status-specific timestamps and actors may also be included.
 *
 * Fields:
 * - status_id → required lifecycle target
 * - received_at → warehouse intake timestamp
 * - released_at → QA or operational release timestamp
 * - released_by → internal user responsible for release
 * - released_by_manufacturer_id → manufacturer responsible for release
 */
const updateProductBatchStatusSchema = Joi.object({
    
    // Target lifecycle status
    status_id: validateUUID('Status ID').required(),
    
    // Timestamp when batch is received into warehouse
    received_at: optionalIsoDate('Received At'),
    
    // Timestamp when batch becomes operationally usable
    released_at: optionalIsoDate('Released At'),
    
    // Internal user who performed release
    released_by: validateUUID('Released By').allow(null),
    
    // Manufacturer who approved release
    released_by_manufacturer_id: validateUUID(
      'Released By Manufacturer'
    ).allow(null),
    
  })
  .unknown(false);

module.exports = {
  productBatchQuerySchema,
  createProductBatchBulkSchema,
  editProductBatchMetadataSchema,
  updateProductBatchStatusSchema,
};
