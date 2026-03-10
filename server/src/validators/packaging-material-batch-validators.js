const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  optionalIsoDate,
  validateUUID,
  validateString,
  validatePositiveDecimal,
  requiredIsoDate,
  validatePositiveIntegerRequired,
} = require('./general-validators');

/**
 * Packaging Material Batch query schema
 *
 * Validates query parameter shape and types for paginated
 * packaging material batch list endpoints.
 *
 * Includes:
 * - Pagination
 * - Sorting (default: received_at)
 * - Packaging material batch lifecycle filters
 * - Packaging material & supplier filters
 * - Keyword fuzzy search (interpretation deferred to service layer)
 *
 * Explicitly excludes:
 * - Product batches
 * - Polymorphic batch registry concerns
 * - Visibility or ACL logic
 *
 * IMPORTANT:
 * - Visibility rules (e.g. packaging batch access, supplier exposure)
 *   are enforced in business/service layers
 * - Keyword field eligibility is ACL-governed (NOT client-controlled)
 * - This schema validates input shape and types ONLY
 * - No filtering, visibility, or search logic is applied here
 */
const packagingMaterialBatchQuerySchema = paginationSchema
  .concat(createSortSchema('received_at'))
  .keys({
    // --------------------------------------------------
    // Core packaging material batch filters
    // --------------------------------------------------
    statusIds: validateUUIDOrUUIDArrayOptional(
      'Packaging Material Batch Status IDs'
    ),

    // --------------------------------------------------
    // Packaging material & supplier identity filters
    // --------------------------------------------------
    packagingMaterialIds: validateUUIDOrUUIDArrayOptional(
      'Packaging Material IDs'
    ),

    supplierIds: validateUUIDOrUUIDArrayOptional('Supplier IDs'),

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
      'Keyword for fuzzy match (lot, material, supplier)'
    ),
  });

/**
 * Joi schema for validating a single packaging material batch creation payload.
 *
 * This schema ensures all fields required to create a packaging material batch
 * are validated before reaching the service layer.
 *
 * Key validations include:
 * - Supplier relationship
 * - Lot number
 * - Manufacturing and expiry dates
 * - Quantity and unit
 * - Optional cost and currency information
 *
 * This schema is intended for validating individual batch records in bulk
 * batch creation requests.
 *
 * Security:
 * - Prevents malformed or missing data entering the service layer.
 *
 * Performance:
 * - Joi validation cost is linear with number of fields.
 * - Used within bulk validation limits (max 200 records).
 */
const createPackagingMaterialBatchSchema = Joi.object({
  packaging_material_supplier_id: validateUUID(
    'Packaging Material Supplier ID'
  ),
  lot_number: validateString('Lot Number', 10, 100),
  quantity: validatePositiveIntegerRequired(),
  unit: validateString('Unit', 1, 5),
  manufacture_date: requiredIsoDate(),
  expiry_date: requiredIsoDate(),
  material_snapshot_name: validateString(
    'Material Snapshot Name',
    10,
    150
  ),
  received_label_name: validateString(
    'Received Label Name',
    10,
    150
  ),
  unit_cost: validatePositiveDecimal(),
  currency: Joi.string()
    .length(3)
    .uppercase()
    .optional()
    .allow(null),
  exchange_rate: validatePositiveDecimal()
    .optional()
    .allow(null),
  total_cost: validatePositiveDecimal(),
  notes: validateOptionalString('Notes'),
  registryNote: validateOptionalString('Registry Note'),
});

/**
 * Joi schema for validating bulk packaging material batch creation requests.
 *
 * This schema wraps multiple batch records and ensures:
 *
 * - At least one batch is provided
 * - No more than 200 records are submitted in a single request
 *
 * Limiting bulk size protects the system from excessive validation
 * and database load during large batch imports.
 *
 * Typical usage:
 * POST /packaging-material-batches/bulk
 *
 * Example payload:
 * {
 *   "packagingMaterialBatches": [...]
 * }
 *
 * @type {Joi.ObjectSchema}
 */
const createPackagingMaterialBatchBulkSchema = Joi.object({
  packagingMaterialBatches: Joi.array()
    .items(createPackagingMaterialBatchSchema)
    .min(1)
    .max(200)
    .required(),
});

module.exports = {
  packagingMaterialBatchQuerySchema,
  createPackagingMaterialBatchBulkSchema,
};
