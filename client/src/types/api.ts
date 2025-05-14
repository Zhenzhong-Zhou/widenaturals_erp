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
