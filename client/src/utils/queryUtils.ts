import { cleanObject } from '@utils/objectUtils.ts';

/**
 * Builds query parameters for paginated API requests.
 *
 * Combines pagination, sorting, and filter values into a single object
 * and removes any undefined, null, or empty string values.
 *
 * Useful for constructing clean query objects before making HTTP requests.
 *
 * @param page - Current page number
 * @param limit - Number of records per page
 * @param sortBy - Field to sort by (optional)
 * @param sortOrder - Sort direction: 'ASC' or 'DESC' (optional)
 * @param filters - Additional filter parameters (optional)
 * @returns A sanitized object with all defined query parameters
 */
export const buildQueryParams = (
  page: number,
  limit: number,
  sortBy?: string,
  sortOrder?: string,
  filters: Record<string, any> = {}
): Record<string, any> => {
  return cleanObject({
    page,
    limit,
    sortBy,
    sortOrder,
    ...filters,
  });
};

/**
 * Applies pagination, sorting, and filters by constructing query parameters
 * and invoking the provided fetch function.
 *
 * Internally uses `buildQueryParams` to clean and normalize parameters
 * before making a fetch call.
 *
 * @param page - Current page number
 * @param limit - Number of items per page
 * @param sortBy - Field to sort by (optional)
 * @param sortOrder - Sort order, e.g., 'ASC' or 'DESC' (optional)
 * @param filters - Additional filter conditions (optional)
 * @param fetchFn - Callback function that performs the data fetch with built parameters
 */
export const applyFiltersAndSorting = ({
                                         page,
                                         limit,
                                         sortBy,
                                         sortOrder,
                                         filters,
                                         fetchFn,
                                       }: {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: string;
  filters?: Record<string, any>;
  fetchFn: (params: Record<string, any>) => void;
}): void => {
  const queryParams = buildQueryParams(page, limit, sortBy, sortOrder, filters ?? {});
  fetchFn(queryParams);
};
