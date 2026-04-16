/**
 * @file hash-utils.js
 * @description SHA-256 hashing utilities for deterministic integrity checks
 * and deduplication across domains.
 *
 * Uses Node.js built-in `crypto` module — no external dependencies.
 * All functions are pure and synchronous.
 *
 * Exports:
 *  - computeLogChecksum    — SHA-256 checksum for inventory activity log entries
 *  - generateAddressHash   — SHA-256 deduplication hash for address records
 */

'use strict';

const crypto = require('crypto');

// ─── Inventory Activity Log Checksum ─────────────────────────────────────────

/**
 * Computes a deterministic SHA-256 checksum for an inventory activity log entry.
 *
 * Fields are pipe-joined in a fixed order before hashing to ensure
 * reproducibility. The checksum is stored on the log row and can be used
 * to detect duplicate or tampered entries.
 *
 * `referenceId` defaults to an empty string when omitted — used for
 * direct warehouse operations (inbound, adjust, status change) that have
 * no triggering external reference. Pass explicitly for order-driven or
 * fulfillment-driven log entries.
 *
 * @param {object} fields
 * @param {string} fields.warehouseInventoryId  - UUID of the warehouse_inventory row.
 * @param {string} fields.actionTypeId          - UUID of the inventory action type.
 * @param {number} fields.previousQuantity      - Quantity before the change.
 * @param {number} fields.quantityChange        - Delta applied (negative for deductions).
 * @param {number} fields.newQuantity           - Quantity after the change.
 * @param {string} fields.performedBy           - UUID of the acting user.
 * @param {string} fields.performedAt           - ISO timestamp of the operation.
 * @param {string} [fields.referenceId='']      - UUID of the triggering reference
 *                                                (order, fulfillment, transfer).
 *                                                Omit for direct warehouse operations.
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
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
};

// ─── Address Deduplication Hash ───────────────────────────────────────────────

/**
 * Generates a deterministic SHA-256 hash for an address record.
 *
 * Normalizes and concatenates the fields that define the physical location
 * and purpose (label) before hashing. Used for deduplication and unique
 * constraint enforcement on the addresses table.
 *
 * Intentionally excludes recipient-specific or contact fields
 * (`full_name`, `phone`, `email`) — the same physical address shared by
 * different contacts should produce the same hash.
 *
 * All fields are lowercased and trimmed before joining to ensure
 * case/whitespace differences do not produce different hashes.
 *
 * @param {object}      address
 * @param {string|null} [address.customer_id]   - Customer UUID (nullable for guest addresses).
 * @param {string}      [address.label]          - Purpose label (e.g. `'Home'`, `'Work'`).
 * @param {string}      address.address_line1    - Primary address line (required).
 * @param {string}      [address.address_line2]  - Secondary address line (unit, suite, etc.).
 * @param {string}      address.city             - City (required).
 * @param {string}      [address.state]          - State or province (optional by country).
 * @param {string}      address.postal_code      - Postal or ZIP code (required).
 * @param {string}      address.country          - Country name or code (required).
 * @returns {string} SHA-256 hex digest.
 */
const generateAddressHash = (address) => {
  // Normalize each field — null/undefined treated as empty string.
  const clean = (val) => (val ?? '').trim().toLowerCase();

  const payload = [
    clean(address.customer_id),
    clean(address.label),
    clean(address.address_line1),
    clean(address.address_line2),
    clean(address.city),
    clean(address.state),
    clean(address.postal_code),
    clean(address.country),
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  computeLogChecksum,
  generateAddressHash,
};
