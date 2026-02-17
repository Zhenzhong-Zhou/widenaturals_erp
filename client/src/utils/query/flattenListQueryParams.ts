/**
 * Normalizes paginated list query parameters into a flat object
 * suitable for query string serialization.
 *
 * Responsibilities:
 * - Extracts grouped `filters` from params
 * - Flattens nested filter properties into top-level keys
 * - Lifts common date range fields:
 *     - createdAfter
 *     - createdBefore
 *     - updatedAfter
 *     - updatedBefore
 *
 * Behavior:
 * - Performs shallow flattening only (no deep object traversal)
 * - Does not mutate the input object
 * - Does not validate filter values
 * - Omits undefined fields naturally via object spreading
 *
 * Intended Usage:
 * - Used by paginated list services before calling `buildQueryString`
 * - Keeps service implementations clean and consistent
 *
 * Design Characteristics:
 * - Stateless
 * - Feature-agnostic
 * - Safe for concurrent execution
 *
 * @param params - List query params containing pagination, sorting, and optional grouped filters
 * @returns A flat key-value object ready for query string serialization
 */
export const flattenListQueryParams = <
  T extends {
    filters?: object;
  }
>(
  params: T = {} as T
): Record<string, unknown> => {
  const { filters = {}, ...rest } = params;
  
  const {
    createdAfter,
    createdBefore,
    updatedAfter,
    updatedBefore,
    ...otherFilters
  } = filters as Record<string, unknown>;
  
  const flatDateParams: Record<string, unknown> = {};
  
  if (createdAfter) flatDateParams.createdAfter = createdAfter;
  if (createdBefore) flatDateParams.createdBefore = createdBefore;
  if (updatedAfter) flatDateParams.updatedAfter = updatedAfter;
  if (updatedBefore) flatDateParams.updatedBefore = updatedBefore;
  
  return {
    ...rest,
    ...otherFilters,
    ...flatDateParams,
  };
};
