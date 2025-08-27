/**
 * Extracts the first 3 segments of an order number separated by `-`.
 *
 * Example:
 *   getShortOrderNumber('SO-SSO-20250825214440-ddafd152-05a7e91c7c')
 *   → 'SO-SSO-20250825214440'
 */
export const getShortOrderNumber = (value?: string | null): string => {
  if (typeof value !== 'string' || !value.includes('-')) return '';
  const parts = value.split('-');
  return parts.length >= 3 ? parts.slice(0, 3).join('-') : value;
};
