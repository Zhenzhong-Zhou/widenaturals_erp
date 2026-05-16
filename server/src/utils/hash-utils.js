/**
 * @file hash-utils.js
 * @description SHA-256 hashing utilities for deterministic integrity checks
 * and deduplication across domains.
 *
 * Uses Node.js built-in `crypto` module. No external dependencies.
 *
 * Exports:
 * - computeLogChecksum  — deterministic checksum for inventory activity log entries
 * - generateAddressHash — deterministic deduplication hash for address records
 */

'use strict';

const crypto = require('crypto');

/**
 * Normalizes a value before including it in an integrity checksum payload.
 *
 * This helper is intentionally conservative:
 * - null/undefined become an empty string
 * - Date values become ISO strings
 * - all other values are stringified without trimming or lowercasing
 *
 * Do not use this for address deduplication, where case and whitespace should
 * be normalized differently.
 *
 * @param {unknown} value - Value to normalize before hashing.
 * @returns {string} Stable string representation for checksum generation.
 */
const normalizeChecksumValue = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

/**
 * Normalizes an address field before generating an address deduplication hash.
 *
 * Address hashes intentionally ignore case and surrounding whitespace so that
 * equivalent address inputs produce the same hash.
 *
 * @param {unknown} value - Address field value.
 * @returns {string} Lowercased and trimmed string value.
 */
const normalizeAddressHashValue = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

// ─── Inventory Activity Log Checksum ─────────────────────────────────────────

/**
 * Computes a deterministic SHA-256 checksum for an inventory activity log entry.
 *
 * Fields are pipe-joined in a fixed order before hashing. The checksum is stored
 * on the inventory activity log row and can be used to detect duplicate or
 * unexpectedly modified log entries.
 *
 * `referenceId` may be omitted for direct warehouse operations such as inbound
 * inventory creation, manual adjustment, or status change. Pass it for
 * order-driven, shipment-driven, transfer-driven, or fulfillment-driven entries.
 *
 * @param {object} fields
 * @param {string} fields.warehouseInventoryId - UUID of the warehouse_inventory row.
 * @param {string} fields.actionTypeId - UUID of the inventory action type.
 * @param {number|string} fields.previousQuantity - Quantity before the change.
 * @param {number|string} fields.quantityChange - Quantity delta.
 * @param {number|string} fields.newQuantity - Quantity after the change.
 * @param {string} fields.performedBy - UUID of the acting user.
 * @param {string|Date} fields.performedAt - Timestamp of the operation.
 * @param {string|null} [fields.referenceId=''] - Optional triggering reference UUID.
 * @returns {string} SHA-256 hex digest.
 */
const computeLogChecksum = ({
  warehouseInventoryId,
  actionTypeId,
  previousQuantity,
  quantityChange,
  newQuantity,
  performedBy,
  performedAt,
  referenceId = '',
}) => {
  const payload = [
    warehouseInventoryId,
    actionTypeId,
    previousQuantity,
    quantityChange,
    newQuantity,
    performedBy,
    performedAt,
    referenceId,
  ]
    .map(normalizeChecksumValue)
    .join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
};

// ─── Address Deduplication Hash ──────────────────────────────────────────────

/**
 * Generates a deterministic SHA-256 hash for an address record.
 *
 * Used for address deduplication and unique constraint enforcement.
 *
 * The hash includes fields that identify the physical address and address
 * purpose. It intentionally excludes recipient/contact fields such as
 * `full_name`, `phone`, and `email`, because different contacts may share the
 * same physical address.
 *
 * @param {object} address
 * @param {string|null} [address.customer_id] - Customer UUID, nullable for guest addresses.
 * @param {string|null} [address.label] - Address label, such as Home or Work.
 * @param {string|null} [address.address_line1] - Primary address line.
 * @param {string|null} [address.address_line2] - Unit, suite, apartment, etc.
 * @param {string|null} [address.city] - City.
 * @param {string|null} [address.state] - State or province.
 * @param {string|null} [address.postal_code] - Postal or ZIP code.
 * @param {string|null} [address.country] - Country name or code.
 * @returns {string} SHA-256 hex digest.
 */
const generateAddressHash = (address) => {
  const payload = [
    normalizeAddressHashValue(address.customer_id),
    normalizeAddressHashValue(address.label),
    normalizeAddressHashValue(address.address_line1),
    normalizeAddressHashValue(address.address_line2),
    normalizeAddressHashValue(address.city),
    normalizeAddressHashValue(address.state),
    normalizeAddressHashValue(address.postal_code),
    normalizeAddressHashValue(address.country),
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  computeLogChecksum,
  generateAddressHash,
};
