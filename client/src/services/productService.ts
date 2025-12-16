import {
  CreateProductBulkInput,
  CreateProductResponse,
  FetchProductParams,
  GetProductApiResponse,
  ProductListResponse,
  ProductStatusUpdateRequest,
  ProductUpdateRequest,
  UpdateProductApiResponse,
} from '@features/product/state';
import { API_ENDPOINTS } from '@services/apiEndpoints';
import { getRequest, patchRequest, postRequest, putRequest } from '@utils/apiRequest';
import { buildQueryString } from '@utils/buildQueryString';
import { sanitizeString } from '@utils/stringUtils';

/**
 * Fetch a paginated list of Products.
 *
 * Issues:
 *   GET /products?page={page}&limit={limit}&sortBy={col}&sortOrder={order}&...
 *
 * Standard response:
 *   PaginatedResponse<ProductListItem>
 *
 * Notes:
 * - Filters are provided in `params.filters`.
 * - Function flattens them into top-level query parameters.
 *
 * @param params - Pagination, sorting, and product filter options.
 * @returns A paginated product list response.
 * @throws Rethrows request helper errors.
 *
 * @example
 * const res = await fetchPaginatedProducts({
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'createdAt',
 *   sortOrder: 'DESC',
 *   filters: { keyword: 'omega' }
 * });
 *
 * console.log(res.data[0].name);
 */
const fetchPaginatedProducts = async (
  params: FetchProductParams = {}
): Promise<ProductListResponse> => {
  const { filters = {}, ...rest } = params;

  // Flatten nested filters
  const flatParams = {
    ...rest,
    ...filters,
  };

  // Build query string
  const queryString = buildQueryString(flatParams);

  // Full URL
  const url = `${API_ENDPOINTS.PRODUCTS.ALL_RECORDS}${queryString}`;

  try {
    return await getRequest<ProductListResponse>(url);
  } catch (error) {
    console.error('Failed to fetch products:', {
      params,
      error,
    });
    throw error;
  }
};

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
    console.error('Failed to create products:', error);
    throw error;
  }
};

/**
 * Fetch a single Product's full detail record by ID.
 *
 * Issues `GET /products/:productId/details` and returns the standard API envelope:
 * `ApiSuccessResponse<ProductResponse>`.
 *
 * Notes:
 * - No query flags are supported for this endpoint.
 * - Ensure `API_ENDPOINTS.PRODUCTS.PRODUCT_DETAILS` has the form:
 *     PRODUCT_DETAILS: (productId: string) => `/products/${productId}/details`
 *
 * @param productId - Product UUID string (trimmed before use).
 * @returns A promise resolving to the Product detail response.
 * @throws Rethrows any error from the request helper.
 *
 * @example
 * const res = await fetchProductDetailById('bd13fb34-ffd0-4138-afbe-f84a71f155a3');
 * console.log(res.data.name);
 */
export const fetchProductDetailById = async (
  productId: string
): Promise<GetProductApiResponse> => {
  const cleanId = sanitizeString(productId);
  const url = API_ENDPOINTS.PRODUCTS.PRODUCT_DETAILS(cleanId);
  
  try {
    return await getRequest<GetProductApiResponse>(url);
  } catch (error) {
    console.error('Failed to fetch product details:', {
      productId: cleanId,
      error,
    });
    throw error;
  }
};

/**
 * Update a Product's information via the backend API.
 *
 * - Sends a PATCH/PUT request containing one or more modifiable fields.
 * - At least one field must be present (validated by productUpdateSchema).
 * - Returns only the updated product's ID upon success.
 * - Errors are logged and rethrown for upstream error boundaries or UI handlers.
 *
 * Endpoint:
 *   PUT /products/:productId/info
 *
 * @param productId - UUID of the product to update.
 * @param payload - Partial update object, allowing any editable product fields.
 * @returns Promise resolving to `{ id: string }` inside an ApiSuccessResponse.
 *
 * @example
 * const res = await updateProductInfoById('411e7fca-bde3-47be-', {
 *   name: 'New Product Name',
 *   category: 'Updated Category'
 * });
 * console.log(res.data.id);
 */
const updateProductInfoById = async (
  productId: string,
  payload: ProductUpdateRequest
): Promise<UpdateProductApiResponse> => {
  const url = API_ENDPOINTS.PRODUCTS.UPDATE_INFO(productId);
  
  try {
    return await putRequest<ProductUpdateRequest, UpdateProductApiResponse>(
      url,
      payload
    );
  } catch (error) {
    console.error('Failed to update product information:', {
      productId,
      payload,
      error,
    });
    throw error;
  }
};

/**
 * Update a Product's status via the backend API.
 *
 * - Sends a PUT request containing only `statusId`.
 * - Status ID must be a valid UUID (validated by updateStatusIdSchema).
 * - Returns the updated product's ID upon success.
 *
 * Endpoint:
 *   PUT /products/:productId/status
 *
 * @param productId - UUID of the product being updated.
 * @param payload - Object containing `statusId`.
 * @returns Promise resolving to `{ id: string }` inside an ApiSuccessResponse.
 *
 * @example
 * await updateProductStatusById('411e7fca-bde3-...', {
 *   statusId: '73f01730-5166-4b83-...'
 * });
 */
const updateProductStatusById = async (
  productId: string,
  payload: ProductStatusUpdateRequest
): Promise<UpdateProductApiResponse> => {
  const url = API_ENDPOINTS.PRODUCTS.UPDATE_STATUS(productId);
  
  try {
    return await patchRequest<ProductStatusUpdateRequest, UpdateProductApiResponse>(
      url,
      payload
    );
  } catch (error) {
    console.error('Failed to update product status:', {
      productId,
      payload,
      error,
    });
    throw error;
  }
};

export const productService = {
  fetchPaginatedProducts,
  createProducts,
  fetchProductDetailById,
  updateProductInfoById,
  updateProductStatusById,
};
