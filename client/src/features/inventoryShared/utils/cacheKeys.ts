export const getDetailCacheKey = (
  itemId: string,
  page: number,
  limit: number
): string => {
  return `${itemId}_${page}_${limit}`;
};
