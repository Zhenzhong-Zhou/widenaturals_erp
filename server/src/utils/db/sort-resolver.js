const { getSortMapForModule } = require('../sort-utils');

/**
 * Resolves sorting configuration based on a predefined module sort map.
 *
 * Converts a client-provided `sortBy` key into a safe SQL column or expression,
 * using a controlled whitelist (sort map). Also supports multi-column default sorting.
 *
 * @param {Object} params
 * @param {string} params.sortBy - Client-provided sort key
 * @param {'ASC'|'DESC'} [params.sortOrder='ASC'] - Sort direction (only applies to primary sort)
 * @param {string} params.moduleKey - Key used to retrieve the module-specific sort map
 * @param {string|string[]} [params.defaultSort='id'] - Default sort if `sortBy` is invalid
 *
 * @returns {{
 *   sortBy: string,
 *   sortOrder: 'ASC'|'DESC',
 *   additionalSorts: Array<{ column: string, direction: 'ASC'|'DESC' }>
 * }}
 *
 * @throws {Error} If module sort map is missing or invalid
 */
const resolveSort = ({
                       sortBy,
                       sortOrder = 'ASC',
                       moduleKey,
                       defaultSort = 'id',
                     }) => {
  const sortMap = getSortMapForModule(moduleKey);
  
  if (!sortMap || typeof sortMap !== 'object') {
    throw new Error(`Invalid sortMap for moduleKey: ${moduleKey}`);
  }
  
  // Normalize direction
  const normalizedOrder =
    String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  // Resolve primary sort field
  const resolved = sortMap[sortBy];
  
  // Normalize defaultSort into array
  const fallbackSorts = Array.isArray(defaultSort)
    ? defaultSort
    : [defaultSort];
  
  // If valid sort key found → use it
  if (resolved) {
    return {
      sortBy: resolved,
      sortOrder: normalizedOrder,
      additionalSorts: [],
    };
  }
  
  // Fallback: support multi-column default sort (explicit structure)
  const [primary, ...rest] = fallbackSorts;
  
  return {
    sortBy: primary,
    sortOrder: normalizedOrder,
    additionalSorts: rest.map((col) => ({
      column: col,
      direction: 'ASC', // deterministic default
    })),
  };
};

module.exports = {
  resolveSort,
};
