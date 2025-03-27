import slugify from 'slugify';

const slugCache: Record<string, string> = {};

/**
 * Converts a string to a URL-friendly slug and caches the result for performance improvement.
 * @param orderType - The string to convert to a slug.
 * @returns A URL-friendly slug.
 */
export const getOrderTypeSlug = (orderType: string): string => {
  if (!slugCache[orderType]) {
    slugCache[orderType] = slugify(orderType, { lower: true });
  }
  return slugCache[orderType];
};
