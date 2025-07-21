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
 * Query parameters for paginated lookup-style API requests.
 *
 * Intended for lightweight, infinite-scroll or autocomplete use cases
 * where total record count is not required.
 */
export interface LookupPagination {
  /**
   * Maximum number of records to return.
   * Used to limit the page size.
   */
  limit?: number;
  
  /**
   * Number of records to skip before starting to return results.
   * Used for pagination offset (typically: (page - 1) * limit).
   */
  offset?: number;
}

/**
 * Pagination metadata returned with lookup-style API responses.
 *
 * Can also be used in frontend state to support infinite scroll or load-more patterns.
 */
export interface PaginationLookupInfo extends LookupPagination {
  /**
   * Indicates whether more items are available for fetching.
   */
  hasMore: boolean;
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
  pagination: Pagination | null;

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
 * Represents the sort order direction for query or UI sorting logic.
 *
 * - 'ASC': Ascending order (e.g., A → Z, 0 → 9).
 * - 'DESC': Descending order (e.g., Z → A, 9 → 0).
 * - '': No sort applied (or default to backend sorting).
 */
export type SortOrder = 'ASC' | 'DESC' | '';

/**
 * Represents sorting options for paginated data queries.
 *
 * Allows the client to specify which field to sort by,
 * and in which direction (ascending or descending).
 *
 * It Can be combined with other query types like pagination or filters
 * to build flexible API requests.
 *
 * Example usage:
 * {
 *   sortBy: 'productName',
 *   sortOrder: 'DESC'
 * }
 */
export interface SortConfig {
  /**
   * The field name to sort by (must align with backend-supported fields).
   * Example: 'createdAt', 'customerName'
   */
  sortBy?: string;

  /**
   * Sort direction.
   * - 'ASC' for ascending (A → Z / 0 → 9)
   * - 'DESC' for descending (Z → A / 9 → 0)
   * - '' if no specific sort order
   */
  sortOrder?: SortOrder;
}

/**
 * A generic structure for successful lookup-style paginated API responses.
 *
 * Designed for use in infinite-scroll or load-more UIs where full pagination
 * metadata (e.g., totalRecords, totalPages) is not required.
 *
 * @template T - The type of each item in the `items` array.
 */
export interface LookupSuccessResponse<T> extends PaginationLookupInfo {
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
}

/**
 * Redux-managed state for lookup data with load-more or infinite scroll.
 *
 * @template T - Type of each lookup item.
 */
export interface PaginatedLookupState<T> extends AsyncState<T[]>, PaginationLookupInfo {}

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
 * Filter for date ranges on created and updated timestamps.
 *
 * Useful for querying resources within a specific creation or update date range (ISO 8601 strings).
 * Applies >= or <= conditions on backend queries.
 */
export interface CreatedUpdatedDateFilter {
  /** Include records created on or after this ISO timestamp (>= condition) */
  createdAfter?: string;

  /** Include records created on or before this ISO timestamp (<= condition) */
  createdBefore?: string;

  /** Include records updated on or after this ISO timestamp (>= condition) */
  updatedAfter?: string;

  /** Include records updated on or before this ISO timestamp (<= condition) */
  updatedBefore?: string;
}

/**
 * Filter for querying by who created or last updated the record.
 *
 * Useful for audit queries or admin-level filtering by user.
 */
export interface CreatedUpdatedByFilter {
  /** Filter by creator's user ID (UUID v4) */
  createdBy?: string;

  /** Filter by updater's user ID (UUID v4) */
  updatedBy?: string;
}
