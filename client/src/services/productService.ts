import type {
  CreateProductBulkInput,
  CreateProductResponse
} from '@features/product/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { postRequest } from '@utils/apiRequest';

/**
 * Create one or more Products via the backend API.
 *
 * - Sends a POST request containing either a single product or an array of products.
 * - Supports bulk create operations using the CreateProductBulkInput schema.
 * - Returns metadata, operational stats, and an array of created product records.
 * - Errors are logged and rethrown for upstream handling.
 *
 * @param {CreateProductBulkInput} payload - Object containing one or more product definitions.
 * @returns {Promise<CreateProductResponse>} The API response with created product records.
 * @throws Rethrows network or server errors for the caller to handle.
 *
 * @example
 * const res = await createProducts({
 *   products: [
 *     {
 *       name: 'Omega-3 Softgels',
 *       brand: 'Wide Naturals',
 *       category: 'Supplements',
 *       series: 'Heart & Brain',
 *       description: 'High purity omega-3 from fish oil.',
 *       weight_g: 150
 *     }
 *   ]
 * });
 * console.log(res.data[0].id);
 */
export const createProducts = async (
  payload: CreateProductBulkInput
): Promise<CreateProductResponse> => {
  const url = API_ENDPOINTS.PRODUCTS.ADD_NEW_RECORD;
  
  try {
    return await postRequest<CreateProductBulkInput, CreateProductResponse>(
      url,
      payload
    );
  } catch (error) {
    console.error("Failed to create products:", error);
    throw error;
  }
};

export const productService = {
  createProducts,
};
