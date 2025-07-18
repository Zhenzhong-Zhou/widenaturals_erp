import type {
  InventoryAllocationPayload,
  InventoryAllocationResponse,
} from '@features/inventoryAllocation';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import axiosInstance from '@utils/axiosConfig';

/**
 * Submits inventory allocation data to the server.
 *
 * @param {InventoryAllocationPayload} payload - The inventory allocation request body.
 * @returns {Promise<InventoryAllocationResponse>} - The server response with allocation results.
 * @throws {Error} - If the request fails.
 */
export const postInventoryAllocation = async (
  payload: InventoryAllocationPayload
): Promise<InventoryAllocationResponse> => {
  try {
    const { orderId, items } = payload;
    const endpoint = API_ENDPOINTS.INVENTORY_ALLOCATION_EXECUTE.replace(
      ':id',
      orderId
    );
    const response = await axiosInstance.post<InventoryAllocationResponse>(
      endpoint,
      { items: items }
    );
    return response.data;
  } catch (error) {
    console.error('Error posting inventory allocation:', error);
    throw new Error('Inventory allocation failed. Please try again later.');
  }
};

export const inventoryAllocationService = {
  postInventoryAllocation,
};
