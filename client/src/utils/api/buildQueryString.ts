/**
 * Converts an object into a URL query string.
 * Filters out undefined and null values.
 *
 * Useful for appending query parameters to URLs in a clean and type-safe way.
 *
 * @example
 * buildQueryString({ keyword: 'abc', limit: 10 });
 * // returns "?keyword=abc&limit=10"
 *
 * buildQueryString({ keyword: '', offset: undefined });
 * // returns "?keyword="
 *
 * buildQueryString(undefined);
 * // returns ""
 *
 * @param params - The query object (e.g. { keyword: 'abc', limit: 10 }).
 * @returns A query string like `?keyword=abc&limit=10`, or an empty string if no valid entries.
 */
export const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  
  const str = searchParams.toString();
  return str ? `?${str}` : '';
};
