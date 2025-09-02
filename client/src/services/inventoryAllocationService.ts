import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse, AllocationReviewRequest, InventoryAllocationReviewResponse,
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

/**
 * Fetches the inventory allocation review details for a specific order.
 *
 * This function calls the backend API endpoint to retrieve a detailed
 * summary of allocation records (header and item-level data) for the given
 * order ID and allocation ID list.
 *
 * Intended for use in review workflows such as pre-confirmation validation
 * or audit UI rendering.
 *
 * @async
 * @param {string} orderId - The UUID of the order to review allocations for.
 * @param {AllocationReviewRequest} body - Request payload containing an array of allocation IDs.
 * @returns {Promise<InventoryAllocationReviewResponse>} A typed response containing review header and allocation items.
 * @throws {Error} If the request fails due to network issues or server errors. Error should be handled upstream.
 */
const fetchInventoryAllocationReview = async (
  orderId: string,
  body: AllocationReviewRequest
): Promise<InventoryAllocationReviewResponse> => {
  const url = API_ENDPOINTS.INVENTORY_ALLOCATIONS.REVIEW_ALLOCATION(orderId);
  
  try {
    return await postRequest<AllocationReviewRequest, InventoryAllocationReviewResponse>(url, body);
  } catch (error) {
    console.error('Failed to fetch inventory allocation review', { orderId, error, });
    throw error;
  }
};

export const inventoryAllocationService = {
  allocateInventoryForOrderService,
  fetchInventoryAllocationReview,
};
