/**
 * Extracts status codes from an array of status objects.
 *
 * This function is typically used to isolate `code` values from
 * structures like `{ code, category }` before querying the database
 * for matching status records.
 *
 * @param {Array<{ code: string; category: string }>} statusObjects - Input array of status objects.
 * @returns {string[]} - Array of non-empty status codes (e.g. ['ORDER_PENDING', 'ORDER_CONFIRMED']).
 */
const extractStatusCodesAndFetchIds = (statusObjects) => {
  if (!Array.isArray(statusObjects) || statusObjects.length === 0) return [];
  return statusObjects.map((s) => s.code).filter(Boolean);
};

/**
 * Extracts valid status IDs from an array of order status records.
 *
 * This utility is used after fetching full status records (e.g., from DB)
 * and returns only the `id` fields, filtering out any null or undefined values.
 *
 * @param {Array<{ id?: string }>} statusObjects - Array of order status records with optional `id` field.
 * @returns {string[]} - Array of resolved status ID strings.
 */
const extractStatusIds = (statusObjects = []) =>
  statusObjects.map((s) => s?.id).filter(Boolean);

module.exports = {
  extractStatusCodesAndFetchIds,
  extractStatusIds,
};
