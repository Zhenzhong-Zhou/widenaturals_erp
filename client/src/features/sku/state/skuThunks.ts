/**
 * ================================================================
 * SKU Thunks Module
 * ================================================================
 *
 * Responsibility:
 * - Orchestrates asynchronous SKU workflows.
 * - Serves as the boundary between UI and skuService.
 *
 * Scope:
 * - Fetch paginated SKU product cards
 * - Fetch SKU detail records
 * - Fetch paginated SKU list
 * - Create SKUs in bulk
 * - Update SKU status
 *
 * Architecture:
 * - API calls delegated to skuService
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
  CreateSkuBulkInput,
  CreateSkuResponse,
  FetchSkusParams,
  GetSkuDetailResponse,
  GetSkuListUiResponse,
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams,
  UpdateSkuDimensionsRequest,
  UpdateSkuDimensionsResponse,
  UpdateSkuIdentityRequest,
  UpdateSkuIdentityResponse,
  UpdateSkuMetadataRequest,
  UpdateSkuMetadataResponse,
  UpdateSkuStatusRequestBody,
  UpdateSkuStatusResponse,
  UpdateSkuStatusThunkArgs,
} from '@features/sku/state/skuTypes';
import { skuService } from '@services/skuService';
import {
  extractUiErrorPayload,
  type UiErrorPayload,
} from '@utils/error/uiErrorUtils';
import { flattenSkuRecords } from '@features/sku/utils';

/**
 * Fetches paginated SKU product cards.
 *
 * Responsibilities:
 * - Calls skuService.fetchPaginatedSkuProductCards
 * - Returns paginated SKU product card records
 * - Preserves backend pagination metadata
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param params - Pagination, sorting, and filtering options
 */
export const fetchPaginatedSkuProductCardsThunk = createAsyncThunk<
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams | undefined,
  { rejectValue: UiErrorPayload }
>('skus/fetchPaginatedProductCards', async (params, { rejectWithValue }) => {
  try {
    return await skuService.fetchPaginatedSkuProductCards(params);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches a single SKU detail record.
 *
 * Responsibilities:
 * - Calls skuService.fetchSkuDetailById
 * - Returns the API response envelope without transformation
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param skuId - SKU UUID
 */
export const getSkuDetailByIdThunk = createAsyncThunk<
  GetSkuDetailResponse,
  string,
  { rejectValue: UiErrorPayload }
>('skus/getSkuDetailById', async (skuId, { rejectWithValue }) => {
  try {
    return await skuService.fetchSkuDetailById(skuId);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Fetches a paginated list of SKUs and converts
 * API records into UI-ready rows.
 *
 * Responsibilities:
 * - Calls skuService.fetchPaginatedSkus
 * - Flattens domain SKU models before entering Redux state
 * - Preserves pagination metadata
 *
 * Transformation Boundary:
 * - Raw SKU models → flattenSkuRecords → UI models
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param params - Pagination, sorting, and filtering options
 */
export const fetchPaginatedSkusThunk = createAsyncThunk<
  GetSkuListUiResponse,
  FetchSkusParams,
  { rejectValue: UiErrorPayload }
>('skus/fetchList', async (params, { rejectWithValue }) => {
  try {
    const response = await skuService.fetchPaginatedSkus(params);

    return {
      ...response,
      data: flattenSkuRecords(response.data),
    };
  } catch (error) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Creates one or more SKU records.
 *
 * Responsibilities:
 * - Calls skuService.createSkus
 * - Sends bulk SKU creation payload
 * - Returns API response containing created SKU records
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param payload - Bulk SKU creation input
 */
export const createSkusThunk = createAsyncThunk<
  CreateSkuResponse,
  CreateSkuBulkInput,
  { rejectValue: UiErrorPayload }
>('skus/createSkus', async (payload, { rejectWithValue }) => {
  try {
    return await skuService.createSkus(payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Updates the metadata of a SKU.
 *
 * Responsibilities:
 * - Calls skuService.updateSkuMetadata
 * - Sends metadata payload (description, size_label, language, market_region)
 * - Returns API response containing updated SKU ID
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param skuId  - SKU UUID
 * @param payload - Metadata update payload
 */
export const updateSkuMetadataThunk = createAsyncThunk<
  UpdateSkuMetadataResponse,
  { skuId: string; payload: UpdateSkuMetadataRequest },
  { rejectValue: UiErrorPayload }
>('skus/updateMetadata', async ({ skuId, payload }, { rejectWithValue }) => {
  try {
    return await skuService.updateSkuMetadata(skuId, payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Updates the status of a SKU.
 *
 * Responsibilities:
 * - Calls skuService.updateSkuStatus
 * - Sends new status identifier
 * - Returns API response containing updated SKU ID
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param skuId    - SKU UUID
 * @param statusId - New SKU status identifier
 */
export const updateSkuStatusThunk = createAsyncThunk<
  UpdateSkuStatusResponse,
  UpdateSkuStatusThunkArgs,
  { rejectValue: UiErrorPayload }
>('skus/updateStatus', async ({ skuId, statusId }, { rejectWithValue }) => {
  try {
    const payload: UpdateSkuStatusRequestBody = { statusId };
    return await skuService.updateSkuStatus(skuId, payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Updates the physical dimensions of a SKU.
 *
 * Responsibilities:
 * - Calls skuService.updateSkuDimensions
 * - Sends dimension payload (length_cm, width_cm, height_cm, weight_g)
 * - Returns API response containing updated SKU ID
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param skuId  - SKU UUID
 * @param payload - Dimensions update payload
 */
export const updateSkuDimensionsThunk = createAsyncThunk<
  UpdateSkuDimensionsResponse,
  { skuId: string; payload: UpdateSkuDimensionsRequest },
  { rejectValue: UiErrorPayload }
>('skus/updateDimensions', async ({ skuId, payload }, { rejectWithValue }) => {
  try {
    return await skuService.updateSkuDimensions(skuId, payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});

/**
 * Updates the identity fields of a SKU.
 *
 * Responsibilities:
 * - Calls skuService.updateSkuIdentity
 * - Sends identity payload (sku, barcode)
 * - Returns API response containing updated SKU ID
 *
 * Error Model:
 * - Failures return `UiErrorPayload`
 *
 * @param skuId  - SKU UUID
 * @param payload - Identity update payload
 */
export const updateSkuIdentityThunk = createAsyncThunk<
  UpdateSkuIdentityResponse,
  { skuId: string; payload: UpdateSkuIdentityRequest },
  { rejectValue: UiErrorPayload }
>('skus/updateIdentity', async ({ skuId, payload }, { rejectWithValue }) => {
  try {
    return await skuService.updateSkuIdentity(skuId, payload);
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
