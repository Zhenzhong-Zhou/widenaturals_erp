import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse,
  AllocationReviewRequest,
  FetchPaginatedInventoryAllocationsParams,
  InventoryAllocationResponse,
  InventoryAllocationReviewResponse,
} from '@features/inventoryAllocation/state/inventoryAllocationTypes.ts';
import { inventoryAllocationService } from '@services/inventoryAllocationService.ts';

/**
 * Thunk to allocate inventory for a given order.
 *
 * Sends a `POST /inventory-allocations/allocate/:orderId` request to trigger
 * allocation logic on the server, using the specified strategy and optional warehouse scope.
 *
 * Automatically dispatches `pending`, `fulfilled`, and `rejected` actions, which can be
 * handled by Redux slices to update loading state, result data, or error messages.
 *
 * ## Input:
 * - `params.orderId`: The UUID of the order to allocate inventory for (required).
 * - `body.strategy`: Optional allocation strategy (`fifo`, `fefo`, `lifo`, `custom`, etc.).
 * - `body.warehouseId`: Optional UUID of warehouse to constrain allocation scope.
 *
 * ## Output:
 * - On success: returns `{ success: true, message: string, data: { orderId, allocationIds } }`.
 * - On failure: dispatches `.rejected` with a meaningful error message.
 *
 * ## Best Practice:
 * Use `.unwrap()` in consuming components to handle success/error with try/catch.
 *
 * @param payload - Includes route `params` and `body` for the allocation request.
 * @returns A promise resolving to the allocation response on success.
 * @throws Returns a rejected value via `rejectWithValue` on failure (used by slice).
 *
 * @example
 * try {
 *   const result = await dispatch(allocateInventoryThunk({
 *     params: { orderId: 'abc-123' },
 *     body: { strategy: 'fefo', warehouseId: 'warehouse-uuid' }
 *   })).unwrap();
 *   console.log(result.data.allocationIds);
 * } catch (err) {
 *   console.error('Allocation failed:', err);
 * }
 */
export const allocateInventoryThunk = createAsyncThunk<
  AllocateInventoryResponse, // Return type (data only)
  { params: AllocateInventoryParams; body: AllocateInventoryBody } // Payload
>(
  'inventory/allocateInventory',
  async ({ params, body }, { rejectWithValue }) => {
    try {
      return await inventoryAllocationService.allocateInventoryForOrderService(params, body);
    } catch (error: any) {
      console.error('Thunk failed to allocate inventory:', error);
      return rejectWithValue(error?.response?.data || error.message || 'Unknown error');
    }
  }
);

/**
 * Thunk to fetch the inventory allocation review for a specific order.
 *
 * This thunk dispatches the `pending`, `fulfilled`, and `rejected` action types
 * automatically using Redux Toolkit's `createAsyncThunk`. It invokes the
 * `fetchInventoryAllocationReview` API function to retrieve detailed allocation
 * data, including order header and allocation item rows.
 *
 * Can be consumed by React components or other logic to trigger data loading
 * into the inventory allocation review slice.
 *
 * @param {Object} args - Argument object containing parameters for the API call.
 * @param {string} args.orderId - UUID of the order to review.
 * @param {AllocationReviewRequest} args.body - Request payload containing allocation IDs to fetch.
 * @returns {Promise<InventoryAllocationReviewResponse>} - Resolves with a typed response containing review data.
 * @throws {any} The thunk will reject with an error payload if the API call fails.
 */
export const fetchInventoryAllocationReviewThunk = createAsyncThunk<
  InventoryAllocationReviewResponse, // Return type
  { orderId: string; body: AllocationReviewRequest } // Argument type
>(
  'inventoryAllocations/fetchReview',
  async ({ orderId, body }, { rejectWithValue }) => {
    try {
      return await inventoryAllocationService.fetchInventoryAllocationReview(orderId, body);
    } catch (error: any) {
      console.error('Thunk: Failed to fetch inventory allocation review', {
        orderId,
        error,
      });
      return rejectWithValue(error?.response?.data ?? error.message);
    }
  }
);

/**
 * Async thunk to fetch a paginated list of inventory allocation summaries.
 *
 * This thunk handles fetching inventory allocations from the backend API
 * based on the provided pagination, sorting, and filtering parameters.
 * It is typically used to power paginated list views in the UI.
 *
 * Usage example:
 * ```ts
 * dispatch(fetchPaginatedInventoryAllocationsThunk({
 *   page: 1,
 *   limit: 20,
 *   filters: {
 *     keyword: 'NMN',
 *     warehouseId: '1234-uuid',
 *     allocationCreatedBy: '5678-uuid',
 *     allocatedAfter: '2025-09-01T00:00:00.000Z',
 *   },
 *   sortBy: 'orderDate',
 *   sortOrder: 'DESC',
 * }))
 * ```
 *
 * @param params - Pagination, sorting, and filtering options for the request.
 * @returns A promise that resolves with a paginated list of inventory allocations.
 *
 * @throws Returns a rejected thunk action with error payload if the API call fails.
 */
export const fetchPaginatedInventoryAllocationsThunk = createAsyncThunk<
  InventoryAllocationResponse,                     // Returned response type
  FetchPaginatedInventoryAllocationsParams         // Input params
>(
  'inventoryAllocations/fetch',
  async (params, { rejectWithValue }) => {
    try {
      return await inventoryAllocationService.fetchPaginatedInventoryAllocations(params);
    } catch (error) {
      console.error('Thunk failed: fetchInventoryAllocationsThunk', error);
      return rejectWithValue(error);
    }
  }
);
