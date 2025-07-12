const express = require('express');
const {
  createAddressController,
  getPaginatedAddressesController,
} = require('../controllers/address-controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  addressArraySchema,
  addressQuerySchema
} = require('../validators/address-validators');
const { sanitizeInput } = require('../middlewares/sanitize');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');

const router = express.Router();

/**
 * @route   POST /add-new-addresses
 * @access  Protected
 * @permission create_addresses
 * @desc    Create one or more address records.
 *
 *          Accepts a JSON array of address objects for single or bulk insertion.
 *          Performs validation, sanitization, conflict handling, and audit logging.
 *
 * @body    {Array<Object>} addresses - Array of address objects to create. Each address must include required fields
 *          like address_line1, city, postal_code, and country. Optional fields include customer_id, phone, email, etc.
 *
 * @returns {201} On success, returns an array of created address records or a single record if one was inserted.
 *                        Each record includes metadata (e.g., id, customerId, displayAddress).
 *
 * @throws  {400} If validation fails or input is invalid.
 * @throws  {403} If the user lacks permission.
 * @throws  {500} On unexpected failures.
 */
router.post(
  '/add-new-addresses',
  authorize(['create_addresses']),
  validate(addressArraySchema, 'body'),
  sanitizeInput,
  createAddressController
);

/**
 * GET /addresses
 *
 * Fetches paginated address records with optional filters and sorting.
 *
 * Use unified query normalization middleware to:
 * - Trim query keys and values
 * - Normalize pagination (page, limit)
 * - Sanitize sortBy and sortOrder using allowed address fields
 * - Normalize specific filters into arrays (e.g., customerId, createdBy)
 *
 * Requires `view_address` permission.
 *
 * Query parameters:
 * - page (integer, optional): Page number (default 1)
 * - limit (integer, optional): Records per page (default 10, max 100)
 * - sortBy (string, optional): Field to sort by (default 'created_at'). Must match allowed fields from addressSortMap
 * - sortOrder (string, optional): ASC or DESC (default DESC)
 * - region (string, optional): Filter by region (max 100 chars)
 * - country (string, optional): Filter by country (max 100 chars)
 * - city (string, optional): Filter by city (max 100 chars)
 * - customerId (UUID, optional): Filter by customer ID
 * - createdBy (UUID, optional): Filter by creator ID
 * - updatedBy (UUID, optional): Filter by updater ID
 * - keyword (string, optional): Partial match against label, recipient name, email, phone, or city
 * - createdAfter (ISO date, optional): Filter for records created on or after this date
 * - createdBefore (ISO date, optional): Filter for records created before or on this date
 * - updatedAfter (ISO date, optional): Filter for records updated on or after this date
 * - updatedBefore (ISO date, optional): Filter for records updated before or on this date
 *
 * Response: 200 OK
 * {
 *   success: true,
 *   message: "Addresses retrieved successfully.",
 *   data: [ { ...address fields... } ],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }
 */
router.get(
  '/',
  authorize(['view_address']),
  createQueryNormalizationMiddleware(
    ['customerId', 'createdBy', 'updatedBy'],
    'addressSortMap'
  ),
  sanitizeInput,
  validate(
    addressQuerySchema,
    'query',
    { convert: true }, // Avoid stripUnknown to catch typos or invalid keys
    'Invalid query parameters.'
  ),
  getPaginatedAddressesController
);

module.exports = router;
