import { createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseInventoryService } from '@services/warehouseInventoryService.ts';
import type {
  AvailableInventoryLot,
  FetchAvailableInventoryRequest,
  InventoryAllocationPayload,
  InventoryAllocationResponse,
} from '@features/inventoryAllocation';
import { inventoryAllocationService } from '@services/inventoryAllocationService.ts';

export const fetchAvailableInventoryLotsThunk = createAsyncThunk<
  AvailableInventoryLot[], // Return type (payload)
  FetchAvailableInventoryRequest // Argument type
>(
  'inventoryAllocation/fetchAvailableInventoryLots',
  async (params, { rejectWithValue }) => {
    try {
      const res =
        await warehouseInventoryService.fetchAvailableInventoryLots(params);
      return res?.data ?? []; // safe fallback
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          'Failed to fetch available inventory lots'
      );
    }
  }
);

/**
 * Thunk to post inventory allocation data to the server.
 *
 * @param {InventoryAllocationPayload} payload - The inventory allocation request body.
 * @returns {Promise<InventoryAllocationResponse>} - The allocation result from the server.
 * @throws {Error} - If the allocation request fails.
 *
 * Usage:
 * dispatch(postInventoryAllocationThunk(payload))
 */
export const postInventoryAllocationThunk = createAsyncThunk<
  InventoryAllocationResponse, // return type
  InventoryAllocationPayload // argument type
>('inventory/allocation/post', async (payload, { rejectWithValue }) => {
  try {
    return await inventoryAllocationService.postInventoryAllocation(payload);
  } catch (error) {
    return rejectWithValue('Failed to allocate inventory.');
  }
});
