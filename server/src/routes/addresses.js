const express = require('express');
const { createAddressController } = require('../controllers/address-controller');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { addressArraySchema } = require('../validators/address-validators');
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

module.exports = router;
