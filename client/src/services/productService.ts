import type {
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
import { getRequest, postRequest, putRequest, patchRequest } from '@utils/http';
import { buildQueryString } from '@utils/buildQueryString';
import { sanitizeString } from '@utils/stringUtils';

/* =========================================================
 * Products
 * ======================================================= */

/**
 * Fetch a paginated list of products.
 *
 * READ-only, idempotent, retry-safe.
 */
const fetchPaginatedProducts = (
  params: FetchProductParams = {}
): Promise<ProductListResponse> => {
  const { filters = {}, ...rest } = params;

  const queryString = buildQueryString({
    ...rest,
    ...filters,
  });

  return getRequest<ProductListResponse>(
    `${API_ENDPOINTS.PRODUCTS.ALL_RECORDS}${queryString}`,
    { policy: 'READ' }
  );
};

/**
 * Create one or more products.
 *
 * WRITE operation (bulk-safe, non-idempotent).
 */
const createProducts = (
  payload: CreateProductBulkInput
): Promise<CreateProductResponse> =>
  postRequest<CreateProductBulkInput, CreateProductResponse>(
    API_ENDPOINTS.PRODUCTS.ADD_NEW_RECORD,
    payload
  );

/**
 * Fetch full product details by ID.
 *
 * READ-only operation.
 */
const fetchProductDetailById = (
  productId: string
): Promise<GetProductApiResponse> => {
  const cleanId = sanitizeString(productId);

  return getRequest<GetProductApiResponse>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_DETAILS(cleanId),
    { policy: 'READ' }
  );
};

/**
 * Update editable product information.
 *
 * WRITE operation.
 */
const updateProductInfoById = (
  productId: string,
  payload: ProductUpdateRequest
): Promise<UpdateProductApiResponse> =>
  putRequest<ProductUpdateRequest, UpdateProductApiResponse>(
    API_ENDPOINTS.PRODUCTS.UPDATE_INFO(productId),
    payload
  );

/**
 * Update product status.
 *
 * WRITE operation with minimal payload.
 */
const updateProductStatusById = (
  productId: string,
  payload: ProductStatusUpdateRequest
): Promise<UpdateProductApiResponse> =>
  patchRequest<ProductStatusUpdateRequest, UpdateProductApiResponse>(
    API_ENDPOINTS.PRODUCTS.UPDATE_STATUS(productId),
    payload
  );

/* =========================================================
 * Public API
 * ======================================================= */

export const productService = {
  fetchPaginatedProducts,
  createProducts,
  fetchProductDetailById,
  updateProductInfoById,
  updateProductStatusById,
};
