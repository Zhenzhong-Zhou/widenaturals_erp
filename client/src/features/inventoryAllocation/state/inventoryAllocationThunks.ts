import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse,
  AllocationReviewRequest,
  FetchPaginatedInventoryAllocationsParams,
  InventoryAllocationConfirmationResponse,
  InventoryAllocationListResponse,
  InventoryAllocationReviewResponse,
} from '@features/inventoryAllocation/state/inventoryAllocationTypes';
import { inventoryAllocationService } from '@services/inventoryAllocationService';
import {
  flattenAllocationOrderHeader,
  flattenInventoryAllocationReviewItems,
  flattenInventoryAllocationSummary,
} from '@features/inventoryAllocation/utils';
import { extractUiErrorPayload } from '@utils/error';

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
      return await inventoryAllocationService.allocateInventoryForOrderService(
        params,
        body
      );
    } catch (error: any) {
      console.error('Thunk failed to allocate inventory:', error);
      return rejectWithValue(
        error?.response?.data || error.message || 'Unknown error'
      );
    }
  }
);

/**
 * Thunk to fetch the inventory allocation review for a specific order.
 *
 * Responsibilities:
 * - Delegates data fetching to the inventory allocation service layer
 * - Applies canonical flattening to the allocation review payload
 *   (order header + allocation items) at the thunk ingestion boundary
 * - Preserves the API success envelope while transforming inner data
 * - Normalizes API errors into a UI-safe reject payload
 *
 * Design notes:
 * - Thunk intentionally contains no domain or business logic
 * - Returned data is flattened and UI-ready
 * - Redux state never stores raw allocation review entities
 *
 * @param args - Parameters for fetching the allocation review
 * @param args.orderId - UUID of the order to review
 * @param args.body - Request payload containing allocation IDs to fetch
 *
 * @returns A fulfilled action containing flattened allocation review data
 *          (order header and allocation item rows)
 */
export const fetchInventoryAllocationReviewThunk = createAsyncThunk<
  InventoryAllocationReviewResponse,
  { orderId: string; body: AllocationReviewRequest },
  { rejectValue: { message: string; traceId?: string } }
>(
  'inventoryAllocations/fetchReview',
  async ({ orderId, body }, { rejectWithValue }) => {
    try {
      const response =
        await inventoryAllocationService.fetchInventoryAllocationReview(
          orderId,
          body
        );
      
      return {
        ...response,
        data: {
          header: flattenAllocationOrderHeader(response.data.header),
          items: flattenInventoryAllocationReviewItems(response.data.items),
        },
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Async thunk to fetch a paginated list of inventory allocation summaries.
 *
 * Responsibilities:
 * - Delegates data fetching to the inventory allocation service layer
 * - Applies canonical flattening to allocation summary records at the
 *   thunk ingestion boundary
 * - Preserves pagination metadata without transformation
 * - Normalizes API errors into a UI-safe reject payload
 *
 * Design notes:
 * - Thunk contains no domain or business logic
 * - Returned data is flattened and UI-ready
 * - Redux state never stores raw API allocation summary entities
 *
 * @param params - Pagination, sorting, and filtering options
 * @returns A fulfilled action containing flattened allocation summary rows
 */
export const fetchPaginatedInventoryAllocationsThunk = createAsyncThunk<
  InventoryAllocationListResponse,
  FetchPaginatedInventoryAllocationsParams,
  { rejectValue: { message: string; traceId?: string } }
>(
  'inventoryAllocations/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await inventoryAllocationService.fetchPaginatedInventoryAllocations(
          params
        );
      
      return {
        ...response,
        data: response.data.map(flattenInventoryAllocationSummary),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Thunk to confirm inventory allocations for a given order.
 *
 * This thunk dispatches `pending`, `fulfilled`, and `rejected` actions automatically
 * via Redux Toolkit's `createAsyncThunk`. It triggers the backend confirmation
 * process for the specified order and returns the full API response, which includes:
 * - Whether the confirmation was successful
 * - A server message
 * - A detailed payload of confirmed allocations, updated inventory records, and item statuses
 *
 * The result can be consumed in React components, middleware, or slices to drive
 * post-confirmation behavior such as displaying toasts, updating UI state, or refreshing data.
 *
 * @function
 * @async
 * @param {Object} args - Arguments for the confirmation request.
 * @param {string} args.orderId - UUID of the order to confirm inventory allocations for.
 *
 * @returns {Promise<InventoryAllocationConfirmationResponse>} A typed response that includes:
 *  - `success`: whether the operation succeeded
 *  - `message`: backend-provided status message
 *  - `data`: the payload with allocation IDs, inventory updates, and order item statuses
 *
 * @throws {string} Returns a rejected thunk with an error message if the request fails.
 *
 * @example
 * dispatch(confirmInventoryAllocationThunk({ orderId }))
 *   .then((result) => {
 *     if (confirmInventoryAllocationThunk.fulfilled.match(result)) {
 *       toast.success(result.payload.message);
 *     } else {
 *       toast.error(result.payload ?? 'Confirmation failed');
 *     }
 *   });
 */
export const confirmInventoryAllocationThunk = createAsyncThunk<
  InventoryAllocationConfirmationResponse,
  { orderId: string },
  { rejectValue: string }
>('inventoryAllocations/confirm', async ({ orderId }, { rejectWithValue }) => {
  try {
    return await inventoryAllocationService.confirmInventoryAllocation(orderId);
  } catch (error: any) {
    console.error('Thunk: confirmInventoryAllocation failed', error);
    return rejectWithValue(error?.response?.data ?? error.message);
  }
});
