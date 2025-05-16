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
 * A generic interface for managing paginated asynchronous state in Redux or any data layer.
 *
 * @template T - The type of the individual data item in the paginated list.
 */
export interface PaginatedState<T> {
  /** The array of transformed data items returned by the API. */
  data: T[];
  
  /** Pagination metadata including page, limit, totalRecords, and totalPages. */
  pagination: Pagination;
  
  /** Indicates whether the data is currently being fetched. */
  loading: boolean;
  
  /** Optional error message if the fetch operation fails. */
  error: string | null;
}
