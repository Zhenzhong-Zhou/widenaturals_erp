const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  optionalIsoDate,
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

module.exports = {
  productBatchQuerySchema,
};
