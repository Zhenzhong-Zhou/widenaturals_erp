/**
 * Interface representing pagination metadata used in paginated API responses.
 */
export interface Pagination {
  /** Current page number (1-based index) */
  page: number;

  /** Number of records per page */
  limit: number;

  /** Total number of records available across all pages */
  totalRecords: number;

  /** Total number of pages based on the current limit and totalRecords */
  totalPages: number;
}

/**
 * Generic interface for a paginated API response.
 *
 * @template T - The type of the data items returned in the response.
 */
export interface PaginatedResponse<T> {
  /** Indicates whether the request was successful */
  success: boolean;

  /** Human-readable message associated with the response */
  message: string;

  /** Array of data items of type T */
  data: T[];

  /** Pagination metadata for the current response */
  pagination: Pagination;
}

/**
 * Generic interface for a standard successful API response.
 *
 * @template T - The type of the response payload contained in `data`.
 */
export interface ApiSuccessResponse<T> {
  /**
   * Indicates whether the request was successful.
   */
  success: true;

  /**
   * A human-readable message describing the result.
   */
  message: string;

  /**
   * The actual data payload of the response.
   */
  data: T;
}

/**
 * Represents the Redux-managed state for paginated data.
 *
 * @template T - Type of each item in the paginated list.
 */
export interface ReduxPaginatedState<T> {
  /** Fetched data items. */
  data: T[];

  /** Pagination info for current view. */
  pagination: Pagination;

  /** Whether data is currently being loaded. */
  loading: boolean;

  /** Error message if fetching fails. */
  error: string | null;
}

/**
 * Interface representing common pagination parameters used across API requests.
 *
 * This interface is designed to be reusable for any paginated query or endpoint.
 * It defines optional `page` and `limit` values that can be applied generically.
 *
 * Extend this interface in entity-specific request interfaces (e.g., for products, orders, users).
 *
 * @example
 * interface ProductListParams extends PaginationParams {
 *   categoryId?: string;
 * }
 */
export interface PaginationParams {
  /**
   * The current page number (1-based). Defaults to 1 if not specified.
   * Example: page=2 → fetch the second page of results.
   */
  page?: number;

  /**
   * The number of records to return per page. Defaults to 10 or your backend default.
   * Example: limit=25 → return 25 items per page.
   */
  limit?: number;
}

/**
 * Represents async state for any data fetch in Redux or UI state.
 *
 * @template T - Type of the data payload.
 */
export interface AsyncState<T> {
  /**
   * The data payload (can be null before loading or on error).
   */
  data: T;

  /**
   * Whether the request is currently loading.
   */
  loading: boolean;

  /**
   * Error message if the request fails, otherwise null.
   */
  error: string | null;
}

/**
 * Represents sorting options for paginated data queries.
 * This interface allows the client to specify which field to sort by,
 * and in which direction (ascending or descending).
 *
 * It Can be combined with other query parameter types like pagination or filters.
 *
 * Example usage:
 * {
 *   sortBy: 'productName',
 *   sortOrder: 'DESC'
 * }
 */
export interface SortConfig {
  /** The field name to sort by (must align with backend-supported fields). */
  sortBy?: string;

  /** Sort direction: 'ASC' for ascending, 'DESC' for descending. Defaults to 'ASC' if not specified. */
  sortOrder?: 'ASC' | 'DESC' | '';
}

/**
 * A generic structure for successful lookup-style paginated API responses.
 *
 * Designed for use in infinite-scroll or load-more UIs where full pagination
 * metadata (e.g., totalRecords, totalPages) is not required.
 *
 * @template T - The type of each item in the `items` array.
 */
export interface LookupSuccessResponse<T> {
  /**
   * Indicates the API call was successful.
   */
  success: true;

  /**
   * A human-readable message describing the result.
   */
  message: string;

  /**
   * The array of lookup-compatible result items.
   */
  items: T[];

  /**
   * Pagination limit (number of items per request).
   */
  limit: number;

  /**
   * Pagination offset (starting index of returned items).
   */
  offset: number;

  /**
   * Flag indicating if more items are available for loading.
   */
  hasMore: boolean;
}

/**
 * Redux-managed state for lookup data with load-more or infinite scroll.
 *
 * @template T - Type of each lookup item.
 */
export interface PaginatedLookupState<T> extends AsyncState<T[]> {
  /** Whether more items are available to load. */
  hasMore: boolean;

  /** Number of items per request. */
  limit: number;

  /** Current offset used for pagination. */
  offset: number;
}

/**
 * Represents the state of a data-modifying API operation (e.g., POST, PUT, DELETE).
 * Commonly used to track the status and response of a mutation request.
 *
 * @template T - The type of single response item. The `data` field will be an array of T.
 *
 * Example usage:
 * ```ts
 * const initialState: MutationState<UserResponse> = {
 *   data: null,
 *   loading: false,
 *   error: null,
 * };
 * ```
 */
export interface MutationState<T> {
  /**
   * The response payload returned from a successful mutation request.
   * Always an array of type T (even for single-item operations).
   * Set to `null` before the request or if the request fails.
   */
  data: T | null;
  
  /**
   * Indicates whether the mutation request is currently in progress.
   */
  loading: boolean;
  
  /**
   * Error message if the mutation request fails; otherwise `null`.
   */
  error: string | null;
  
  /**
   * Indicates if the mutation was successful.
   * Useful for showing success messages or conditional UI rendering.
   */
  success?: boolean;
  
  /**
   * Server-provided success message or status message, if any.
   */
  message?: string;
}

/**
 * Represents the available entry modes for creating records,
 * such as customers or inventory. Used to toggle between
 * single-entry and bulk-entry forms.
 */
export type CreateMode = 'single' | 'bulk';
