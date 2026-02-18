/**
 * flattenListQueryParams
 *
 * Converts a paginated list query parameter object into a
 * backend-compatible flat query structure.
 *
 * Responsibilities:
 * - Extracts `filters` from the root params object
 * - Flattens selected date-range keys into top-level query parameters
 * - Preserves non-date filters
 * - Preserves pagination and sorting parameters
 * - Removes undefined, null, and empty string values
 *
 * Why this exists:
 * - Backend endpoints expect flat query parameters
 *   (e.g. `expiryAfter=...`) rather than nested `filters.expiryAfter`
 * - Different feature modules support different date-range fields
 * - Prevents duplication of flattening logic across services
 *
 * Design constraints:
 * - Stateless
 * - Side-effect free (does not mutate input)
 * - Module-agnostic
 * - Type-safe: `dateKeys` must exist on the feature's filter type
 *
 * Example:
 *
 * ```ts
 * const flatParams = flattenListQueryParams(params, [
 *   'expiryAfter',
 *   'expiryBefore',
 * ]);
 * ```
 *
 * @typeParam T - Query param type containing an optional `filters` object
 * @param params - Pagination + sorting + filter parameters
 * @param dateKeys - Filter keys that should be flattened as date-range params
 * @returns Flat object suitable for query string serialization
 */
export const flattenListQueryParams = <
  T extends { filters?: object },
>(
  params: T = {} as T,
  dateKeys: (keyof NonNullable<T['filters']>)[]
): Record<string, unknown> => {
  const { filters = {}, ...rest } = params;
  
  const dateKeySet = new Set<string>(dateKeys as string[]);
  
  const flatDateParams: Record<string, unknown> = {};
  const otherFilters: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(
    filters as Record<string, unknown>
  )) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    
    if (dateKeySet.has(key)) {
      flatDateParams[key] = value;
    } else {
      otherFilters[key] = value;
    }
  }
  
  return {
    ...rest,
    ...otherFilters,
    ...flatDateParams,
  };
};
