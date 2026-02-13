const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  optionalIsoDate,
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
    
    supplierIds: validateUUIDOrUUIDArrayOptional(
      'Supplier IDs'
    ),
    
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
    manufactureAfter: optionalIsoDate(
      'Manufacture Date After'
    ),
    manufactureBefore: optionalIsoDate(
      'Manufacture Date Before'
    ),
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

module.exports = {
  packagingMaterialBatchQuerySchema,
};
