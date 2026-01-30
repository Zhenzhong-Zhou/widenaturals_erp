import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
  AllocateInventoryResponse,
  AllocationReviewRequest,
  FetchPaginatedInventoryAllocationsParams,
  InventoryAllocationApiResponse,
  InventoryAllocationConfirmationResponse,
  InventoryAllocationReviewApiResponse,
} from '@features/inventoryAllocation/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, postRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';

/**
 * Allocates inventory for a specific order.
 *
 * Issues:
 *   POST /inventory-allocations/allocate/:orderId
 *
 * Notes:
 * - Allocation strategy and warehouse scope are provided in the request body.
 * - Errors are propagated as normalized AppError instances by the transport layer.
 *
 * @param params - Route parameters containing the order ID.
 * @param body - Allocation options (strategy, warehouseId).
 * @returns Allocation result including orderId and allocationIds.
 * @throws {AppError} When the request fails.
 */
const allocateInventoryForOrderService = async (
  params: AllocateInventoryParams,
  body: AllocateInventoryBody
): Promise<AllocateInventoryResponse> => {
  const { orderId } = params;

  return postRequest<AllocateInventoryBody, AllocateInventoryResponse>(
    API_ENDPOINTS.INVENTORY_ALLOCATIONS.ALLOCATE_ORDER(orderId),
    body
  );
};

/**
 * Fetches allocation review details for a specific order.
 *
 * Issues:
 *   POST /inventory-allocations/review/:orderId
 *
 * @param orderId - Order identifier.
 * @param body - Allocation IDs to review.
 * @returns Allocation review header and item-level details.
 * @throws {AppError} When the request fails.
 */
const fetchInventoryAllocationReview = async (
  orderId: string,
  body: AllocationReviewRequest
): Promise<InventoryAllocationReviewApiResponse> => {
  return postRequest<
    AllocationReviewRequest,
    InventoryAllocationReviewApiResponse
  >(API_ENDPOINTS.INVENTORY_ALLOCATIONS.REVIEW_ALLOCATION(orderId), body);
};

/**
 * Fetches a paginated list of inventory allocations.
 *
 * Issues:
 *   GET /inventory-allocations with pagination, sorting, and filters.
 *
 * Notes:
 * - Filters are flattened into top-level query parameters.
 * - Errors are propagated as normalized AppError instances.
 *
 * @param params - Pagination, sorting, and filter options.
 * @returns Paginated allocation summaries.
 * @throws {AppError} When the request fails.
 */
const fetchPaginatedInventoryAllocations = async (
  params: FetchPaginatedInventoryAllocationsParams = {}
): Promise<InventoryAllocationApiResponse> => {
  const { filters = {}, ...rest } = params;

  const flatParams = {
    ...rest,
    ...filters,
  };

  const queryString = buildQueryString(flatParams);
  const url = `${API_ENDPOINTS.INVENTORY_ALLOCATIONS.ALL_ALLOCATIONS}${queryString}`;

  return getRequest<InventoryAllocationApiResponse>(url);
};

/**
 * Confirms all inventory allocations for a specific order.
 *
 * Issues:
 *   POST /inventory-allocations/confirm/:orderId
 *
 * Notes:
 * - Finalizes allocation lifecycle and updates inventory and order state.
 * - Errors are propagated as normalized AppError instances.
 *
 * @param orderId - Order identifier.
 * @returns Confirmation result and affected allocation details.
 * @throws {AppError} When the request fails.
 */
const confirmInventoryAllocation = async (
  orderId: string
): Promise<InventoryAllocationConfirmationResponse> => {
  return postRequest<void, InventoryAllocationConfirmationResponse>(
    API_ENDPOINTS.INVENTORY_ALLOCATIONS.CONFIRM_ALLOCATION(orderId),
    undefined
  );
};

export const inventoryAllocationService = {
  allocateInventoryForOrderService,
  fetchInventoryAllocationReview,
  fetchPaginatedInventoryAllocations,
  confirmInventoryAllocation,
};
