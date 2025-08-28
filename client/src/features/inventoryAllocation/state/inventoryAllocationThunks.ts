import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse,
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
