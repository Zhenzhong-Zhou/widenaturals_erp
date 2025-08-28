import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse,
} from '@features/inventoryAllocation/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postRequest } from '@utils/apiRequest';

/**
 * Allocates inventory for a specific order using a selected strategy and optional warehouse ID.
 *
 * Sends a `POST` request to `/inventory-allocations/allocate/:orderId` to initiate allocation.
 *
 * ### Behavior:
 * - The allocation strategy can be one of: `fifo`, `fefo`, `lifo`, `custom`, or any future string.
 * - If `warehouseId` is provided, allocation is scoped to that warehouse.
 * - Returns an object containing the order ID and an array of successfully allocated inventory IDs.
 *
 * ### Failure:
 * - Throws if allocation fails due to validation, network error, or internal server issues.
 * - Logs detailed request context including orderId and payload on error.
 *
 * @param params - Object containing the order ID as a route parameter.
 * @param body - Object with optional `strategy` and `warehouseId` fields in the request body.
 * @returns A promise resolving to an `ApiSuccessResponse` with `{ orderId, allocationIds }` payload.
 *
 * @throws - Rethrows any error encountered (use in try/catch or thunk with `rejectWithValue`).
 *
 * @example
 * const res = await allocateInventoryForOrderService(
 *   { orderId: 'abc-123' },
 *   { strategy: 'fefo', warehouseId: 'xyz-789' }
 * );
 * console.log(res.data.allocationIds); // ['inv-1', 'inv-2', ...]
 */
const allocateInventoryForOrderService = async (
  params: AllocateInventoryParams,
  body: AllocateInventoryBody
): Promise<AllocateInventoryResponse> => {
  const { orderId } = params;
  const url = API_ENDPOINTS.INVENTORY_ALLOCATIONS.ALLOCATE_ORDER(orderId);
  
  try {
    return await postRequest<AllocateInventoryBody, AllocateInventoryResponse>(url, body);
  } catch (error) {
    console.error('Failed to allocate inventory for order:', { orderId, body, error });
    throw error;
  }
};

export const inventoryAllocationService = {
  allocateInventoryForOrderService,
};
