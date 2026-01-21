import { NullableString } from '@shared-types/shared';
import {
  Pagination,
  PaginationLookupInfo
} from '@shared-types/pagination';

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
  
  /**
   * Optional trace identifier for request correlation and debugging.
   * Present when backend tracing/logging is enabled.
   */
  traceId?: string;
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

  /**
   * Unique request identifier for tracing/logging.
   */
  traceId: string;
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
 * Redux-managed state for lookup data with load-more or infinite scroll behavior.
 *
 * This type includes:
 * – Async state flags: `loading` and `error`
 * – Pagination metadata: `limit`, `offset`, and `hasMore`
 * – An array of items returned from the lookup; each item has type `T`
 *
 * Commonly used in components such as dropdowns, autocomplete inputs, or paginated lists.
 *
 * @template T - The type of each item in the lookup result set.
 */
export type PaginatedLookupState<T> = AsyncState<T[]> & PaginationLookupInfo;

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

/**
 * Minimal identity reference used across the system.
 * Represents a resolved actor identity.
 */
export interface ActorIdentity {
  id: string;
  name: string;
}

/**
 * Represents an actor associated with an audit action
 * (e.g. createdBy, updatedBy, registeredBy).
 *
 * `id` may be null for system-initiated actions.
 */
export interface AuditUser extends Omit<ActorIdentity, 'id'> {
  id: NullableString;
}

/**
 * Generic audit structure used across multiple domain models.
 *
 * This base audit model supports:
 * - standard created/updated timestamps
 * - createdBy/updatedBy user references
 * - optional module-specific fields (via the `extra` generic)
 *
 * @template TExtra - Additional fields used by a specific module,
 *                    such as `{ uploadedAt: string }` for SKU images.
 */
export interface GenericAudit<TExtra = unknown> {
  /** Timestamp indicating when the record was created. */
  createdAt: string;

  /**
   * User who created the record.
   * May be null for system-generated or legacy records.
   */
  createdBy: AuditUser | null;

  /** Timestamp indicating when the record was last modified. */
  updatedAt: string | null;

  /**
   * User who last updated the record.
   * May be null if the record has never been updated.
   */
  updatedBy: AuditUser | null;

  /**
   * Optional module-specific audit data.
   * Used to extend the audit model when needed.
   * Example: `{ uploadedAt: string }` for image uploads.
   */
  extra?: TExtra;
}

/**
 * Generic status model used across domain entities.
 *
 * @template TName - Restricts status names (e.g., "active" | "inactive").
 */
export interface GenericStatus<TName extends string = string> {
  /** UUID of the status record */
  id: string;

  /** Status label (e.g., "active", "inactive", "pending") */
  name: TName;

  /** Timestamp associated with the status event */
  date: string; // ISO timestamp
}

/**
 * Generic statistics returned from any type of operation
 * (single or bulk).
 *
 * @template T - Optional contextual metadata for the operation.
 */
export interface OperationStats<T = void> {
  /** Number of items received or attempted. Always ≥ 1. */
  inputCount: number;

  /** Number of items successfully processed (1 for single ops). */
  processedCount: number;

  /** Total time taken to complete, in milliseconds. */
  elapsedMs: number;

  /** Optional metadata returned by this specific operation. */
  meta?: T;
}

/**
 * Payload for updating the status of a resource.
 *
 * Matches the Joi schema:
 *   { statusId: UUID }
 */
export interface UpdateStatusIdRequest {
  /** New status ID (UUID) */
  statusId: string;
}

/**
 * Common statistics for any batch-processing operation.
 * Suitable for file uploads, bulk inserts, imports, sync jobs, and migrations.
 */
export interface BatchProcessStats {
  /** Total number of items processed in this batch */
  total: number;

  /** Number of items that completed successfully */
  successCount: number;

  /** Number of items that failed */
  failureCount: number;

  /** Execution time in milliseconds */
  elapsedMs: number;
}

/**
 * Represents an inclusive date range filter.
 *
 * Used for filtering records by date-based fields
 * such as creation date, issue date, expiry date, etc.
 */
export interface DateRange {
  /**
   * Inclusive start date (ISO 8601 string).
   * Records with a date greater than or equal to this value are included.
   */
  from?: string;

  /**
   * Inclusive end date (ISO 8601 string).
   * Records with a date less than or equal to this value are included.
   */
  to?: string;
}

/**
 * Generic image display roles used across the system.
 */
export type ImageType = 'main' | 'thumbnail' | 'zoom' | 'unknown';

/**
 * Supported image file formats for uploads and stored media.
 *
 * This reusable type is shared across SKU images, product images,
 * packaging material assets, document attachments, and any feature
 * that relies on image upload or validation.
 *
 * Extend this union if the backend later supports additional formats
 * (e.g., `avif`, `heif`).
 */
export type ImageFileFormat =
  | 'webp'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'tiff'
  | 'svg';

export interface GenericAvatar {
  /**
   * Publicly accessible image URL.
   */
  url: string;

  /**
   * File format (e.g. 'jpg', 'png', 'webp').
   */
  format: ImageFileFormat | null;

  /**
   * Timestamp when the avatar was uploaded.
   */
  uploadedAt: NullableString;
}
