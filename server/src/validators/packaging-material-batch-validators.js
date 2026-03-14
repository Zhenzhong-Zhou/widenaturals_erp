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
const {
  lifecycleStatusUpdateSchema,
  lifecycleReceiveSchema,
  lifecycleNotes
} = require('./batches/lifecycle-common');

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
 * Joi schema: Validate Packaging Material Batch ID route parameter.
 *
 * Used for routes like:
 *   PATCH /api/v1/packaging-material-batches/:batchId/status
 *   PATCH /api/v1/packaging-material-batches/:batchId/receive
 *   PATCH /api/v1/packaging-material-batches/:batchId/release
 *
 * Ensures the provided packaging material batch ID is a valid UUID.
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = packagingMaterialBatchIdParamSchema.validate(req.params);
 * if (error) throw AppError.validationError(error.message);
 */
const packagingMaterialBatchIdParamSchema = Joi.object({
  batchId: validateUUID('Packaging Material Batch ID')
    .description('UUID of the packaging material batch record'),
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

//------------------------------------------------------------
// Packaging material batch lifecycle schemas
//------------------------------------------------------------

/**
 * Joi schema for updating the lifecycle status of a packaging material batch.
 *
 * This schema reuses the shared lifecycle status update validator
 * to ensure consistent validation rules across all batch domains.
 *
 * Only the minimal payload required for lifecycle transition
 * is accepted:
 *
 * Fields:
 * - status_id (UUID, required)
 *     Target lifecycle status identifier.
 *
 * - notes (string | null)
 *     Optional lifecycle comment or operational note.
 *
 * Notes:
 * This schema intentionally references the shared
 * `lifecycleStatusUpdateSchema` to avoid duplication
 * and guarantee consistent lifecycle validation logic
 * across product batches and packaging material batches.
 *
 * Performance:
 * The schema is instantiated once at module load time
 * and reused for every request, so this pattern has
 * no measurable runtime overhead.
 */
const updatePackagingMaterialBatchStatusSchema =
  lifecycleStatusUpdateSchema;


/**
 * Joi schema for receiving a packaging material batch.
 *
 * This action represents the warehouse intake process when
 * packaging materials arrive from a supplier.
 *
 * Typical lifecycle transition:
 *
 * pending → received
 *
 * Fields:
 * - received_at (ISO date, optional)
 *     Timestamp indicating when the batch was received.
 *     If omitted, the system may automatically assign the
 *     current server timestamp.
 *
 * - notes (string | null)
 *     Optional operational intake note.
 *
 * Notes:
 * Uses the shared lifecycle receive validator to maintain
 * consistent validation behavior across batch domains.
 */
const receivePackagingMaterialBatchSchema =
  lifecycleReceiveSchema;


/**
 * Joi schema for releasing a packaging material batch.
 *
 * This lifecycle action indicates that packaging materials
 * have passed inspection and are approved for manufacturing
 * or packaging operations.
 *
 * Typical lifecycle transition:
 *
 * received → released
 *
 * Fields:
 * - supplier_id (UUID, required)
 *     Supplier responsible for the packaging materials.
 *
 * - notes (string | null)
 *     Optional QA or operational comment recorded during release.
 *
 * Notes:
 * Unlike status and receive schemas, this validator defines
 * a domain-specific field (`supplier_id`) because packaging
 * batches are associated with suppliers rather than manufacturers.
 */
const releasePackagingMaterialBatchSchema = Joi.object({
  supplier_id: validateUUID('Supplier ID').required(),
  notes: lifecycleNotes,
}).unknown(false);

module.exports = {
  packagingMaterialBatchQuerySchema,
  createPackagingMaterialBatchBulkSchema,
  packagingMaterialBatchIdParamSchema,
  editPackagingMaterialBatchMetadataSchema,
  updatePackagingMaterialBatchStatusSchema,
  receivePackagingMaterialBatchSchema,
  releasePackagingMaterialBatchSchema,
};
