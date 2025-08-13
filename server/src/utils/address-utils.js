const { formatAddress } = require('./string-utils');

/**
 * @typedef {Object} BuiltAddressUserFacing
 * @property {string} id
 * @property {string|null} customerId
 * @property {string|null} fullName
 * @property {string|null} phone
 * @property {string|null} email
 * @property {string|null} label
 * @property {string}       [formatted]     // present when includeFormatted === true
 * @property {string|null}  [line1]         // present when formattedOnly === false
 * @property {string|null}  [line2]
 * @property {string|null}  [city]
 * @property {string|null}  [state]
 * @property {string|null}  [postalCode]
 * @property {string|null}  [country]
 * @property {string|null}  [region]
 */

/**
 * Build an address object from a row using a column-name prefix ("shipping_" | "billing_").
 *
 * Behavior:
 * - Returns `null` if `${prefix}address_id` is falsy (no address on the row).
 * - When `includeFormatted=true`, computes `formatted` via `formatAddress({...})`.
 * - When `formattedOnly=true`, returns only identity + `formatted` (no line/city/etc).
 * - If `formattedOnly=true`, `includeFormatted` is forced to `true`.
 *
 * Expected row columns (by prefix):
 * - `${prefix}address_id`, `${prefix}customer_id`, `${prefix}full_name`, `${prefix}phone`, `${prefix}email`, `${prefix}label`
 * - `${prefix}address_line1`, `${prefix}address_line2`, `${prefix}city`, `${prefix}state`, `${prefix}postal_code`,
 *   `${prefix}country`, `${prefix}region`
 *
 * @param {Record<string, any>} row
 * @param {'shipping_'|'billing_'|string} prefix  Column prefix (must end with `_`, e.g., "shipping_")
 * @param {{ includeFormatted?: boolean, formattedOnly?: boolean }} [opts]
 * @returns {BuiltAddressUserFacing|null}
 *
 * @example
 * // Minimal object when no address id:
 * buildAddress(row, 'shipping_') // -> null if row.shipping_address_id is missing
 *
 * @example
 * // Full object with formatted:
 * buildAddress(row, 'billing_', { includeFormatted: true })
 *
 * @example
 * // Compact payload for UI display:
 * buildAddress(row, 'shipping_', { formattedOnly: true })
 */
const buildAddress = (row, prefix, { includeFormatted = true, formattedOnly = false } = {}) => {
  if (!row[`${prefix}address_id`]) return null;
  
  const base = {
    id: row[`${prefix}address_id`],
    customerId: row[`${prefix}customer_id`] ?? null,
    fullName: row[`${prefix}full_name`] ?? null,
    phone: row[`${prefix}phone`] ?? null,
    email: row[`${prefix}email`] ?? null,
    label: row[`${prefix}label`] ?? null,
  };
  
  if (includeFormatted) {
    base.formatted = formatAddress({
      address_line1: row[`${prefix}address_line1`],
      address_line2: row[`${prefix}address_line2`],
      city:          row[`${prefix}city`],
      state:         row[`${prefix}state`],
      postal_code:   row[`${prefix}postal_code`],
      country:       row[`${prefix}country`],
      region:        row[`${prefix}region`],
    });
  }
  
  if (formattedOnly) {
    // keep only the identity + formatted fields; drop line1/line2/city/state/etc entirely
    return base;
  }
  
  // keep flattened fields (legacy/full detail)
  return {
    ...base,
    line1: row[`${prefix}address_line1`] ?? null,
    line2: row[`${prefix}address_line2`] ?? null,
    city: row[`${prefix}city`] ?? null,
    state: row[`${prefix}state`] ?? null,
    postalCode: row[`${prefix}postal_code`] ?? null,
    country: row[`${prefix}country`] ?? null,
    region: row[`${prefix}region`] ?? null,
  };
};

module.exports = {
  buildAddress,
};
