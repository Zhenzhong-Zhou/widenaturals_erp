import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  CreateProductBulkInput,
  CreateProductResponse,
  FetchProductParams,
  GetProductApiResponse,
  ProductListResponse,
  ProductStatusUpdateRequest,
  ProductUpdateRequest,
  UpdateProductApiResponse,
  UpdateProductStatusThunkArgs,
} from '@features/product/state/productTypes';
import { productService } from '@services/productService';

/**
 * Fetch a paginated list of products with optional sorting and filter criteria.
 *
 * This thunk wraps the `productService.fetchPaginatedProducts` API helper and:
 * - Merges pagination, sorting, and filter options
 * - Sends them as flattened query parameters to the backend
 * - Returns a strongly typed `ProductListResponse` on success
 * - Normalizes and serializes API errors into a clean `rejectValue` message
 *
 * Typical usage:
 * ```ts
 * dispatch(fetchPaginatedProductsThunk({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'DESC',
 *   filters: {
 *     keyword: 'omega',
 *     brand: 'Herbal Natural',
 *   },
 * }));
 * ```
 *
 * The caller (slice or component) will receive:
 * - `fulfilled` → `ProductListResponse`
 * - `rejected` → serialized error string
 *
 * @param params - Pagination, sorting, and product filter options.
 *
 * @returns A promise resolving to `ProductListResponse` on success,
 *          or a rejected action with a string error message.
 *
 * @see ProductListResponse
 * @see FetchProductParams
 * @see productService.fetchPaginatedProducts
 */
export const fetchPaginatedProductsThunk = createAsyncThunk<
  ProductListResponse,
  FetchProductParams,
  { rejectValue: string }
>('products/fetchPaginated', async (params, { rejectWithValue }) => {
  try {
    return await productService.fetchPaginatedProducts(params);
  } catch (error: any) {
    console.error('fetchProductsThunk failed:', error);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch product list';

    return rejectWithValue(message);
  }
});

/**
 * Async thunk: Create one or more products.
 *
 * This thunk wraps the `productService.createProducts()` call and provides
 * a normalized, Redux-friendly interface for managing loading, success,
 * and error states related to bulk product creation.
 *
 * ## Behavior
 * - Dispatches pending → fulfilled/rejected lifecycle actions.
 * - Sends a payload containing one or more product definitions.
 * - Returns the API response (`CreateProductResponse`) on success.
 * - Normalizes backend and network errors into a clean string for slice handling.
 *
 * ## Usage
 * ```ts
 * const payload: CreateProductBulkInput = {
 *   products: [
 *     { name: "Vitamin D3", brand: "Wide Naturals", category: "Supplements" }
 *   ]
 * };
 *
 * const result = await dispatch(createProductsThunk(payload));
 *
 * if (createProductsThunk.fulfilled.match(result)) {
 *   console.log("Created IDs:", result.payload.data);
 * }
 * ```
 *
 * ## Error Handling
 * - Captures server-side validation errors
 * - Captures network issues (timeouts, connectivity failures)
 * - Falls back to a generic error message if none is provided
 *
 * @param payload - Bulk product creation input object.
 * @returns A Promise that resolves with `CreateProductResponse` on success,
 *          or rejects with a normalized error string via `rejectWithValue`.
 */
export const createProductsThunk = createAsyncThunk<
  CreateProductResponse,
  CreateProductBulkInput,
  { rejectValue: string }
>('products/createProducts', async (payload, { rejectWithValue }) => {
  try {
    return await productService.createProducts(payload);
  } catch (err: any) {
    console.error('createProductsThunk error:', err);

    // Normalize backend / network error message
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to create products.';

    return rejectWithValue(message);
  }
});

/**
 * Thunk: Fetch a single product's full detail record by ID.
 *
 * This thunk calls `productService.fetchProductDetailById(productId)` and returns
 * the full standard API envelope (`ApiSuccessResponse<ProductResponse>`). The reducer
 * is responsible for unwrapping the `.data` payload if needed.
 *
 * Usage:
 * ```ts
 * dispatch(fetchProductDetailByIdThunk(productId));
 * ```
 *
 * Behavior:
 * - The service layer trims and sanitizes the incoming `productId`.
 * - Resolves with `GetProductApiResponse`, containing:
 *     - `success`
 *     - `message`
 *     - `data` (the `ProductResponse`)
 *     - `traceId`
 * - On failure, the thunk returns a human-readable message via `rejectWithValue`.
 * - No additional transformation is applied in this thunk; the response is returned
 *   exactly as delivered by the backend.
 *
 * @param productId - UUID of the product to fetch.
 * @returns The full API envelope (`GetProductApiResponse`) wrapped in AsyncThunk logic.
 */
export const fetchProductDetailByIdThunk = createAsyncThunk<
  GetProductApiResponse,
  string,
  { rejectValue: string }
>('products/fetchProductDetailById', async (productId, { rejectWithValue }) => {
  try {
    return await productService.fetchProductDetailById(productId);
  } catch (error: any) {
    console.error('fetchProductDetailByIdThunk failed:', {
      productId,
      error,
    });

    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to fetch product details';

    return rejectWithValue(message);
  }
});

/**
 * Thunk: Update a product's core information fields by ID.
 *
 * Issues a `PUT /products/:productId/info` request to update one or more
 * editable product attributes. The backend enforces that the payload must
 * contain at least one valid field (name, series, brand, category, or
 * description), as validated by `productUpdateSchema`.
 *
 * Behavior:
 * - Accepts a typed partial update payload (`ProductUpdateRequest`).
 * - Returns an `ApiSuccessResponse<{ id: string }>` containing the updated product ID.
 * - Uses `rejectWithValue` to surface human-readable API error messages to the UI.
 * - Logs contextual metadata to help with debugging and monitoring.
 *
 * Typical Use Cases:
 * - Inline editing product fields
 * - Product detail page "Edit" form submission
 *
 * @param productId - UUID of the product to update.
 * @param payload - Partial fields allowed for update.
 * @returns API envelope containing `{ id }` of the updated product.
 *
 * @example
 * dispatch(updateProductInfoByIdThunk({
 *   productId: '411e7fca-bde3-47be-82b9-4607a6db7580',
 *   payload: { name: 'Updated Product Name' }
 * }));
 */
export const updateProductInfoByIdThunk = createAsyncThunk<
  UpdateProductApiResponse,
  { productId: string; payload: ProductUpdateRequest },
  { rejectValue: string }
>(
  'products/updateProductInfoById',
  async ({ productId, payload }, { rejectWithValue }) => {
    try {
      return await productService.updateProductInfoById(productId, payload);
    } catch (error: any) {
      console.error('updateProductInfoByIdThunk failed:', {
        productId,
        payload,
        error,
      });

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update product information.';

      return rejectWithValue(message);
    }
  }
);

/**
 * Thunk: Update a product's status by ID.
 *
 * Issues a `PUT /products/:productId/status` request and updates only the
 * status field of a product. The payload must include a valid `statusId`,
 * validated by `updateStatusIdSchema`.
 *
 * Behavior:
 * - Accepts a payload containing only `{ statusId: string }`.
 * - Returns an `ApiSuccessResponse<{ id: string }>` with the updated product ID.
 * - Uses `rejectWithValue` for clean error propagation to reducers/UI.
 * - Logs request context to assist with error diagnosis.
 *
 * Typical Use Cases:
 * - Activating or deactivating a product
 * - Workflow/state transitions in product lifecycle
 *
 * @param productId - UUID of the product whose status is being changed.
 * @param payload - Object containing the new `statusId`.
 * @returns API envelope containing `{ id }` of the updated product.
 *
 * @example
 * dispatch(updateProductStatusByIdThunk({
 *   productId: '411e7fca-bde3-47be-82b9-4607a6db7580',
 *   payload: { statusId: '73f01730-5166-4b83-9c56-270d1e03cbf6' }
 * }));
 */
export const updateProductStatusByIdThunk = createAsyncThunk<
  UpdateProductApiResponse,
  UpdateProductStatusThunkArgs,
  { rejectValue: string }
>(
  'products/updateProductStatusById',
  async ({ productId, statusId }, { rejectWithValue }) => {
    try {
      const payload: ProductStatusUpdateRequest = { statusId };
      return await productService.updateProductStatusById(productId, payload);
    } catch (error: any) {
      console.error('updateProductStatusByIdThunk failed:', {
        productId,
        error,
      });

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update product status.';

      return rejectWithValue(message);
    }
  }
);
