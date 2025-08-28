import type { ApiSuccessResponse, AsyncState } from '@shared-types/api';

/**
 * Parameters extracted from the URL path for allocation requests.
 * Typically used in a route like `/inventory-allocations/allocate/:orderId`.
 */
export interface AllocateInventoryParams {
  /** UUID of the order to allocate inventory for (from `req.params`) */
  orderId: string;
}

/**
 * Enum-like strategy options for how inventory should be allocated.
 * Accepts known strategies or future custom ones.
 */
export type AllocationStrategy =
  | 'fifo'   // First-In-First-Out
  | 'fefo'   // First-Expiry-First-Out
  | 'lifo'   // Last-In-First-Out
  | 'custom' // Manually prioritized
  | string;  // Future custom strategy fallback

/**
 * Request body payload sent during inventory allocation.
 */
export interface AllocateInventoryBody {
  /** Allocation strategy to use (optional, defaults server-side) */
  strategy?: AllocationStrategy;
  
  /** Warehouse to constrain allocation scope to (optional UUID) */
  warehouseId?: string;
}

/**
 * Core response payload from the allocation API.
 * Returned in the `.data` field of the standard `ApiSuccessResponse`.
 */
export interface AllocateInventoryData {
  /** UUID of the order that was allocated */
  orderId: string;
  
  /** Array of UUIDs representing the inventory records allocated */
  allocationIds: string[];
}

/**
 * Full response structure for a successful allocation request.
 * Wraps the `AllocateInventoryData` in a standard success format.
 */
export type AllocateInventoryResponse = ApiSuccessResponse<AllocateInventoryData>;

/**
 * Redux state shape for tracking the async allocation process.
 * Includes loading state, error message, and response data.
 */
export type AllocateInventoryState = AsyncState<AllocateInventoryData | null>;
