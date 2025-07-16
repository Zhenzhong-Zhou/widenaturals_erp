import type {
  PaginatedResponse,
  PaginationParams,
  ReduxPaginatedState,
  SortConfig
} from '@shared-types/api.ts';

/**
 * Filter parameters for querying order types.
 */
export interface OrderTypeFilters {
  /** Filter by name (partial match) */
  name?: string | null;
  
  /** Filter by code (partial match) */
  code?: string | null;
  
  /** Filter by category (e.g., 'logistics', 'finance') */
  category?: string | null;
  
  /** Filter by status ID */
  statusId?: string;
  
  /** Filter by whether payment is required */
  requiresPayment?: boolean;
  
  /** Filter by user ID who created the order type */
  createdBy?: string;
  
  /** Filter by user ID who last updated the order type */
  updatedBy?: string;
  
  /** Full-text keyword search across fields */
  keyword?: string;
  
  /** Filter by created date after this ISO timestamp (inclusive) */
  createdAfter?: string;
  
  /** Filter by created date before this ISO timestamp (inclusive) */
  createdBefore?: string;
  
  /** Filter by updated date after this ISO timestamp (inclusive) */
  updatedAfter?: string;
  
  /** Filter by updated date before this ISO timestamp (inclusive) */
  updatedBefore?: string;
}

/**
 * Sortable fields for order types.
 */
export type OrderTypeSortBy =
  | 'name'
  | 'code'
  | 'category'
  | 'requiresPayment'
  | 'description'
  | 'statusName'
  | 'statusDate'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'defaultNaturalSort';

/**
 * Parameters for fetching paginated and sorted order type records.
 */
export interface FetchPaginatedOrderTypesParams extends PaginationParams, SortConfig {
  /** Optional filtering options */
  filters?: OrderTypeFilters;
}

/**
 * Represents a single order type record in a list.
 */
export interface OrderTypeListItem {
  /** Unique ID of the order type */
  id: string;
  
  /** Display name of the order type */
  name: string;
  
  /** Category of the order type (e.g., 'logistics') */
  category: string;
  
  /** Whether this order type requires payment */
  requiresPayment: boolean;
  
  /** Description of the order type */
  description: string;
  
  /** Status ID (foreign key to statuses table) */
  statusId: string;
  
  /** Human-readable name of the status */
  statusName: string;
  
  /** Timestamp when the status was last updated (ISO 8601) */
  statusDate: string;
  
  /** Timestamp when the record was created (ISO 8601) */
  createdAt: string;
  
  /** Name or ID of the user who created the record */
  createdBy: string;
  
  /** Timestamp when the record was updated (ISO 8601) */
  updatedAt: string;
  
  /** Name or ID of the user who last updated the record */
  updatedBy: string;
  
  /** Unique code of the order type (used for system integration or lookup) */
  code: string;
}

/**
 * Paginated response for order type list queries.
 */
export type OrderTypeListResponse = PaginatedResponse<OrderTypeListItem>;

/**
 * Redux state for a paginated order type list.
 */
export type PaginatedOrderTypeListState = ReduxPaginatedState<OrderTypeListItem>;



export type OrderTypeCategory =
  | 'purchase'
  | 'sales'
  | 'transfer'
  | 'return'
  | 'manufacturing'
  | 'logistics'
  | 'adjustment';
