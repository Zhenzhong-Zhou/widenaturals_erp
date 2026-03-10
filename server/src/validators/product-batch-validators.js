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
 * Joi schema for validating a single product batch creation payload.
 *
 * This schema ensures all required fields for creating a product batch
 * are validated before reaching the service layer.
 *
 * Validations include:
 * - SKU association
 * - Manufacturer reference
 * - Lot number format
 * - Manufacturing and expiry dates
 * - Initial quantity
 *
 * Notes and registry notes are optional fields used for internal tracking.
 *
 * Security:
 * - Prevents malformed or missing data entering the service layer.
 *
 * Performance:
 * - Joi validation runs in linear time relative to the number of fields.
 * - Intended to validate individual records inside bulk requests.
 */
const createProductBatchSchema = Joi.object({
  // Unique lot number assigned to the production batch
  lot_number: Joi.string().trim().max(100).required(),
  
  // Associated SKU identifier
  sku_id: validateUUID('SKU ID'),
  
  // Optional manufacturer reference
  manufacturer_id: validateUUID('Manufacturer ID'),
  
  // Manufacturing date in ISO format
  manufacture_date: requiredIsoDate(),
  
  // Expiry date in ISO format
  expiry_date: requiredIsoDate(),
  
  // Quantity produced in this batch
  initial_quantity: validatePositiveIntegerRequired(),
  
  // Optional internal note for the batch
  notes: validateOptionalString('Notes'),
  
  // Optional note stored in batch registry
  registryNote: validateOptionalString('Registry Note'),
});

/**
 * Joi schema for validating bulk product batch creation requests.
 *
 * This schema wraps multiple product batch records and ensures:
 *
 * - At least one batch is provided
 * - No more than 200 batches are submitted in a single request
 *
 * Limiting bulk size protects the system from excessive validation
 * and database load during large batch imports.
 *
 * Typical endpoint usage:
 * POST /product-batches/bulk
 *
 * Example payload:
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

module.exports = {
  productBatchQuerySchema,
  createProductBatchBulkSchema,
};
