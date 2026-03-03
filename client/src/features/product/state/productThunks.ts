/**
 * ================================================================
 * Product Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates product-related asynchronous workflows.
 * - Serves as the boundary between UI and productService.
 *
 * Scope:
 * - Fetch paginated product list
 * - Create products
 * - Fetch product details
 * - Update product information
 * - Update product status
 *
 * Architecture:
 * - API calls delegated to productService
 * - UI normalization occurs at the thunk boundary where required
 * - Redux reducers remain pure and state-focused
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 * ================================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateProductBulkInput,
  CreateProductResponse,
  FetchProductParams,
  GetProductApiResponse,
  PaginatedProductListUiResponse,
  ProductStatusUpdateRequest,
  ProductUpdateRequest,
  UpdateProductApiResponse,
  UpdateProductStatusThunkArgs,
} from '@features/product/state/productTypes';
import { productService } from '@services/productService';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';
import { flattenProductRecords } from '@features/product/utils';

/**
 * Fetches a paginated list of products and converts
 * API records into UI-ready rows.
 *
 * Responsibilities:
 * - Calls productService.fetchPaginatedProducts
 * - Flattens domain product records before entering Redux state
 * - Preserves pagination metadata
 *
 * Transformation Boundary:
 * - Raw product models → flattenProductRecords → UI models
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param params - Pagination, sorting, and filtering options
 */
export const fetchPaginatedProductsThunk = createAsyncThunk<
  PaginatedProductListUiResponse,
  FetchProductParams,
  { rejectValue: UiErrorPayload }
>('products/fetchPaginated', async (params, { rejectWithValue }) => {
  try {
    const response = await productService.fetchPaginatedProducts(params);

    return {
      ...response,
      data: flattenProductRecords(response.data),
    };
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Creates one or more products.
 *
 * Responsibilities:
 * - Calls productService.createProducts
 * - Sends bulk product creation payload
 * - Returns API response directly
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param payload - Bulk product creation input
 */
export const createProductsThunk = createAsyncThunk<
  CreateProductResponse,
  CreateProductBulkInput,
  { rejectValue: UiErrorPayload }
>('products/createProducts', async (payload, { rejectWithValue }) => {
  try {
    return await productService.createProducts(payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches a single product detail record.
 *
 * Responsibilities:
 * - Calls productService.fetchProductDetailById
 * - Returns API response envelope without transformation
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param productId - Product UUID
 */
export const fetchProductDetailByIdThunk = createAsyncThunk<
  GetProductApiResponse,
  string,
  { rejectValue: UiErrorPayload }
>('products/fetchProductDetailById', async (productId, { rejectWithValue }) => {
  try {
    return await productService.fetchProductDetailById(productId);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Updates editable product information fields.
 *
 * Responsibilities:
 * - Calls productService.updateProductInfoById
 * - Sends partial update payload
 * - Returns API response containing updated product ID
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param productId - Product UUID
 * @param payload   - Partial product fields to update
 */
export const updateProductInfoByIdThunk = createAsyncThunk<
  UpdateProductApiResponse,
  { productId: string; payload: ProductUpdateRequest },
  { rejectValue: UiErrorPayload }
>(
  'products/updateProductInfoById',
  async ({ productId, payload }, { rejectWithValue }) => {
    try {
      return await productService.updateProductInfoById(productId, payload);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);

/**
 * Updates the status of a product.
 *
 * Responsibilities:
 * - Calls productService.updateProductStatusById
 * - Sends new status identifier
 * - Returns API response containing updated product ID
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param productId - Product UUID
 * @param statusId  - New product status identifier
 */
export const updateProductStatusByIdThunk = createAsyncThunk<
  UpdateProductApiResponse,
  UpdateProductStatusThunkArgs,
  { rejectValue: UiErrorPayload }
>(
  'products/updateProductStatusById',
  async ({ productId, statusId }, { rejectWithValue }) => {
    try {
      const payload: ProductStatusUpdateRequest = { statusId };
      return await productService.updateProductStatusById(productId, payload);
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
