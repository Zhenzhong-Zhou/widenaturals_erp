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
 * Base Joi schema definition for packaging material batch fields.
 *
 * This schema defines shared validation rules used across multiple
 * packaging material batch operations such as:
 *
 * - batch creation
 * - metadata updates
 * - bulk imports
 *
 * Required/optional constraints are applied in operation-specific
 * schemas (create/edit workflows) using Joi `.fork()`.
 */
const packagingMaterialBatchBaseSchema = {
  // Supplier providing the packaging material batch
  packaging_material_supplier_id: validateUUID('Packaging Material Supplier'),
  
  // Supplier or manufacturing lot identifier
  lot_number: validateString('Lot Number', 10, 100),
  
  // Snapshot name of the material at time of receipt
  material_snapshot_name: validateString(
    'Material Snapshot Name',
    10,
    150
  ),
  
  // Label name recorded during warehouse intake
  received_label_name: validateString(
    'Received Label Name',
    10,
    150
  ),
  
  // Quantity received for this batch
  quantity: validatePositiveIntegerRequired(),
  
  // Unit of measurement (e.g., pcs, kg, box)
  unit: validateString('Unit', 1, 5),
  
  // Manufacturing date from supplier
  manufacture_date: requiredIsoDate(),
  
  // Expiry date if applicable
  expiry_date: requiredIsoDate(),
  
  // Optional cost per unit
  unit_cost: validatePositiveDecimal().allow(null),
  
  // Currency code (ISO 4217)
  currency: Joi.string()
    .length(3)
    .uppercase()
    .allow(null),
  
  // Exchange rate if foreign currency used
  exchange_rate: validatePositiveDecimal().allow(null),
  
  // Calculated total cost for batch
  total_cost: validatePositiveDecimal().allow(null),
  
  // Internal operational notes
  notes: validateOptionalString('Notes', 500),
  
  // Optional note stored in batch registry
  registryNote: validateOptionalString('Registry Note', 500),
};

/**
 * Joi schema for validating a single packaging material batch
 * creation payload.
 *
 * Ensures required fields for batch creation are present before
 * reaching the service layer.
 *
 * Key validations include:
 * - supplier relationship
 * - lot number
 * - manufacturing and expiry dates
 * - quantity and unit
 * - optional cost information
 *
 * Security:
 * - `.unknown(false)` prevents unexpected input fields.
 *
 * Performance:
 * - Joi validation runs in linear time relative to number of fields.
 */
const createPackagingMaterialBatchSchema = Joi.object({
    ...packagingMaterialBatchBaseSchema,
  })
  .fork(
    [
      'packaging_material_supplier_id',
      'lot_number',
      'material_snapshot_name',
      'received_label_name',
      'quantity',
      'unit',
      'manufacture_date',
      'expiry_date',
    ],
    (schema) => schema.required()
  )
  .unknown(false);

/**
 * Joi schema for validating bulk packaging material batch creation.
 *
 * Ensures:
 * - at least one batch is provided
 * - maximum of 200 batches per request
 *
 * Limiting bulk size prevents excessive validation cost and protects
 * database operations from overly large imports.
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

/**
 * Joi schema for updating packaging material batch metadata.
 *
 * Allows partial updates of metadata fields while enforcing:
 *
 * - only known fields may be updated
 * - at least one field must be provided
 *
 * Required fields from creation become optional using `.fork()`.
 */
const editPackagingMaterialBatchMetadataSchema = Joi.object(
    packagingMaterialBatchBaseSchema
  )
  .fork(
    Object.keys(packagingMaterialBatchBaseSchema),
    (schema) => schema.optional()
  )
  .min(1)
  .unknown(false);

/**
 * Joi schema for updating packaging material batch lifecycle status.
 *
 * Used for lifecycle transitions such as:
 *
 * pending → received
 * received → released
 *
 * Fields:
 * - status_id → target lifecycle state
 * - received_at → timestamp of warehouse intake
 */
const updatePackagingMaterialBatchStatusSchema = Joi.object({
    
    // Target lifecycle status
    status_id: validateUUID('Status ID').required(),
    
    // Timestamp when batch is officially received
    received_at: optionalIsoDate('Received At'),
    
  })
  .unknown(false);

module.exports = {
  packagingMaterialBatchQuerySchema,
  createPackagingMaterialBatchBulkSchema,
  editPackagingMaterialBatchMetadataSchema,
  updatePackagingMaterialBatchStatusSchema,
};
