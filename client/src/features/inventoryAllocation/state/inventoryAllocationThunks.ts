import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse,
  AllocationReviewRequest,
  InventoryAllocationConfirmationResponse,
  InventoryAllocationQueryParams,
  InventoryAllocationReviewResponse,
  PaginatedInventoryAllocationListUiResponse,
} from '@features/inventoryAllocation/state/inventoryAllocationTypes';
import { inventoryAllocationService } from '@services/inventoryAllocationService';
import {
  flattenAllocationOrderHeader,
  flattenInventoryAllocationReviewItems,
  flattenInventoryAllocationSummary,
} from '@features/inventoryAllocation/utils';
import { extractUiErrorPayload } from '@utils/error';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';

/**
 * Thunk to allocate inventory for a given order.
 *
 * Responsibilities:
 * - Calls `inventoryAllocationService.allocateInventoryForOrderService`
 * - Triggers backend allocation logic using the specified strategy and scope
 * - Automatically dispatches pending / fulfilled / rejected lifecycle actions
 *
 * Input:
 * - `params.orderId`: UUID of the order (required)
 * - `body.strategy`: Optional allocation strategy (`fifo`, `fefo`, etc.)
 * - `body.warehouseId`: Optional warehouse scope constraint
 *
 * Output (fulfilled):
 * - Returns {@link AllocateInventoryResponse}
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - All thrown errors are normalized using `extractUiErrorPayload`
 * - Guarantees consistent UI-safe reducer behavior
 *
 * Best Practice:
 * Use `.unwrap()` in consuming components to handle success/error via try/catch.
 *
 * @param payload - Route params and request body
 * @returns Fulfilled action with allocation response
 */
export const allocateInventoryThunk = createAsyncThunk<
  AllocateInventoryResponse,
  { params: AllocateInventoryParams; body: AllocateInventoryBody },
  { rejectValue: UiErrorPayload }
>(
  'inventory/allocateInventory',
  async ({ params, body }, { rejectWithValue }) => {
    try {
      return await inventoryAllocationService.allocateInventoryForOrderService(
        params,
        body
      );
    } catch (error: unknown) {
      console.error('Thunk failed to allocate inventory:', {
        params,
        body,
        error,
      });

      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Thunk to fetch the inventory allocation review for a specific order.
 *
 * Responsibilities:
 * - Delegates fetching to the service layer
 * - Flattens allocation review payload (header + items)
 * - Ensures Redux stores only UI-ready review structures
 *
 * Design Principles:
 * - No domain/business logic inside thunk
 * - Transformation occurs strictly at the API boundary
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - Errors normalized via `extractUiErrorPayload`
 *
 * @param args - Includes `orderId` and review request body
 * @returns Fulfilled action containing flattened review data
 */
export const fetchInventoryAllocationReviewThunk = createAsyncThunk<
  InventoryAllocationReviewResponse,
  { orderId: string; body: AllocationReviewRequest },
  { rejectValue: UiErrorPayload }
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
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Fetch a paginated list of inventory allocation summaries.
 */
export const fetchPaginatedInventoryAllocationsThunk = createAsyncThunk<
  PaginatedInventoryAllocationListUiResponse,
  InventoryAllocationQueryParams,
  { rejectValue: UiErrorPayload }
>(
  'inventoryAllocations/fetchPaginated',
    async (params, { rejectWithValue }) => {
      try {
        const response =
          await inventoryAllocationService.fetchPaginatedInventoryAllocations(params);
        return {
          ...response,
          data: response.data.map(flattenInventoryAllocationSummary),
        };
      } catch (error: unknown) {
        return rejectWithValue(extractUiErrorPayload(error));
      }
    }
);

/**
 * Thunk to confirm inventory allocations for a given order.
 *
 * Responsibilities:
 * - Triggers backend confirmation workflow
 * - Returns full confirmation response including allocation updates
 *
 * Output (fulfilled):
 * - {@link InventoryAllocationConfirmationResponse}
 *   - `success`
 *   - `message`
 *   - `data` with allocation and inventory updates
 *
 * Error Handling:
 * - Rejects with structured {@link UiErrorPayload}
 * - Errors normalized via `extractUiErrorPayload`
 * - Ensures consistent reducer-level error handling
 *
 * @param args - Includes `orderId`
 * @returns Fulfilled action with confirmation response
 */
export const confirmInventoryAllocationThunk = createAsyncThunk<
  InventoryAllocationConfirmationResponse,
  { orderId: string },
  { rejectValue: UiErrorPayload }
>('inventoryAllocations/confirm', async ({ orderId }, { rejectWithValue }) => {
  try {
    return await inventoryAllocationService.confirmInventoryAllocation(orderId);
  } catch (error: unknown) {
    console.error('Thunk: confirmInventoryAllocation failed', {
      orderId,
      error,
    });

    return rejectWithValue(extractUiErrorPayload(error));
  }
});
