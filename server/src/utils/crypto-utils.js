const crypto = require('crypto');

/**
 * Hashes general data using SHA-256.
 * @param {string} data - The data to hash.
 * @returns {string} - The SHA-256 hash in hex format.
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a unique checksum for inventory history records.
 *
 * @param {Object} payload
 * @param {string} payload.inventory_id
 * @param {string} payload.inventory_action_type_id
 * @param {number} payload.previous_quantity
 * @param {number} payload.quantity_change
 * @param {number} payload.new_quantity
 * @param {string} [payload.source_action_id]
 * @param {string} [payload.comments]
 * @returns {string}
 */
const generateChecksum = ({
  inventory_id,
  inventory_action_type_id,
  previous_quantity,
  quantity_change,
  new_quantity,
  source_action_id,
  comments,
}) => {
  const data = [
    inventory_id,
    inventory_action_type_id,
    previous_quantity,
    quantity_change,
    new_quantity,
    source_action_id || '',
    comments || '',
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Validate inventory history checksum before returning to frontend
 * @param {Object} record - Inventory history record
 * @returns {Boolean} - True if checksum matches, false otherwise
 */
const validateChecksum = (record) => {
  const computedChecksum = crypto
    .createHash('sha256') // Ensure to match database hashing method
    .update(
      [
        record.inventory_id,
        record.inventory_action_type_id,
        record.previous_quantity,
        record.quantity_change,
        record.new_quantity,
        record.source_action_id || '',
        record.comments || '',
      ].join('|')
    )
    .digest('hex');

  return computedChecksum === record.checksum;
};

/**
 * Generates a deterministic SHA-256 hash for an address record.
 *
 * - Normalizes and concatenates key fields that define the physical location and purpose (label).
 * - Produces a consistent hash used for de-duplication and unique constraints.
 * - Ignores recipient-specific or contact fields (e.g., full_name, phone, email).
 *
 * @param {Object} address - The address object containing key fields.
 * @param {string|null} [address.customer_id] - The customer ID linked to the address (nullable for guest addresses).
 * @param {string} [address.label] - The label (e.g., "Home", "Work") to distinguish purpose at the same location.
 * @param {string} address.address_line1 - The primary address line (required).
 * @param {string} [address.address_line2] - The secondary address line (e.g., unit, suite).
 * @param {string} address.city - The city where the address is located.
 * @param {string} [address.state] - The state or province (optional depending on country).
 * @param {string} address.postal_code - The postal or ZIP code (required).
 * @param {string} address.country - The country name or code (required).
 * @returns {string} The SHA-256 hash as a hex string.
 */
const generateAddressHash = (address) => {
  const clean = (val) => (val || '').trim().toLowerCase();

  const hashInput = [
    clean(address.customer_id),
    clean(address.label),
    clean(address.address_line1),
    clean(address.address_line2),
    clean(address.city),
    clean(address.state),
    clean(address.postal_code),
    clean(address.country),
  ].join('|');

  return crypto.createHash('sha256').update(hashInput).digest('hex');
};

module.exports = {
  hashData,
  generateChecksum,
  validateChecksum,
  generateAddressHash,
};
