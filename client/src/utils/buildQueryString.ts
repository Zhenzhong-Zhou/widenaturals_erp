/**
 * Converts a key-value object into a URL-encoded query string.
 *
 * Skips undefined and null values. Serializes arrays by appending multiple values
 * under the same key (e.g., `status=active&status=pending`).
 *
 * Useful for building clean, reusable, and debuggable query strings when
 * sending GET requests or constructing URLs dynamically.
 *
 * @example
 * buildQueryString({ keyword: 'abc', limit: 10 });
 * // returns "?keyword=abc&limit=10"
 *
 * buildQueryString({ status: ['active', 'pending'], offset: 0 });
 * // returns "?status=active&status=pending&offset=0"
 *
 * buildQueryString({ keyword: '', offset: undefined });
 * // returns "?keyword="
 *
 * buildQueryString(undefined);
 * // returns ""
 *
 * @param {Record<string, any>} [params] - Query object with key-value pairs to be serialized.
 * @returns {string} A properly encoded query string prefixed with `?`, or an empty string if no valid entries exist.
 */
export const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v !== undefined && v !== null) {
            searchParams.append(key, String(v));
          }
        });
      } else {
        searchParams.append(key, String(value));
      }
    }
  }

  const str = searchParams.toString();
  return str ? `?${str}` : '';
};
