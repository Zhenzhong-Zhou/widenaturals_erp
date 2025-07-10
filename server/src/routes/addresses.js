const express = require('express');
const { createAddressController, getPaginatedAddressesController, getCustomerAddressesController } = require('../controllers/address-controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { addressArraySchema, addressQuerySchema, getCustomerAddressesQuerySchema } = require('../validators/address-validators');
const { sanitizeInput } = require('../middlewares/sanitize');

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
 * Requires `view_address` permission.
 *
 * Query parameters:
 * - page (integer, optional): Page number (default 1)
 * - limit (integer, optional): Number of records per page (default 10, max 100)
 * - sortBy (string, optional): Field to sort by (default 'created_at'). Must be one of the allowed sort fields.
 * - sortOrder (string, optional): Sorting order (ASC or DESC, default DESC)
 * - region (string, optional): Filter by region (max 100 chars)
 * - country (string, optional): Filter by country (max 100 chars)
 * - city (string, optional): Filter by city (max 100 chars)
 * - customerId (UUID, optional): Filter by customer ID
 * - createdBy (UUID, optional): Filter by creator user ID
 * - updatedBy (UUID, optional): Filter by updater user ID
 * - keyword (string, optional): Filter across label, recipient name, email, phone, city (max 100 chars)
 * - createdAfter (ISO date, optional): Filter addresses created on or after this date
 * - createdBefore (ISO date, optional): Filter addresses created on or before this date
 * - updatedAfter (ISO date, optional): Filter addresses updated on or after this date
 * - updatedBefore (ISO date, optional): Filter addresses updated on or before this date
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
  sanitizeInput,
  validate(
    addressQuerySchema,
    'query',
    { stripUnknown: true, convert: true },
    'Invalid query parameters.'
  ),
  getPaginatedAddressesController
);

/**
 * GET /addresses/by-customer
 *
 * Retrieves all addresses associated with a given customer.
 * Expect a `customerId` as a UUID query parameter.
 *
 * This endpoint is used in workflows like:
 * - Sales order creation
 * - Shipping/billing address selection
 * - Customer profile display
 *
 * Access Control:
 * - Requires authentication
 * - Requires `view_customer` permission
 *
 * Query Parameters:
 * - customerId (string, required): UUID of the customer
 *
 * Responses:
 * - 200: Returns an array of simplified, client-friendly address objects
 * - 400: Invalid query parameters (e.g., missing or malformed customerId)
 * - 403: Unauthorized access
 * - 500: Internal server or service-level error
 */
router.get(
  '/by-customer',
  authorize(['view_customer']),
  sanitizeInput,
  validate(
    getCustomerAddressesQuerySchema,
    'query',
    { stripUnknown: true, convert: true },
    'Invalid query parameters.'
  ),
  getCustomerAddressesController
);

module.exports = router;
