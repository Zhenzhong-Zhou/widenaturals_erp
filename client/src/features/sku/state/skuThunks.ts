import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateSkuBulkInput,
  CreateSkuResponse,
  FetchSkusParams,
  GetSkuDetailResponse,
  GetSkuListResponse,
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams,
  UpdateSkuStatusRequestBody,
  UpdateSkuStatusResponse,
  UpdateSkuStatusThunkArgs,
} from '@features/sku/state/skuTypes';
import { skuService } from '@services/skuService';

/**
 * Thunk: Fetch paginated SKU product cards.
 *
 * Wraps the API helper `fetchPaginatedSkuProductCards` and exposes it
 * to Redux Toolkits async lifecycle (`pending` → `fulfilled` → `rejected`).
 *
 * @param params - Pagination, sorting, and filter parameters
 * @returns A paginated list of SKU product cards + metadata
 *
 * @example
 * dispatch(fetchPaginatedSkuProductCardsThunk({
 *   page: 1,
 *   limit: 20,
 *   sortBy: "productName",
 *   sortOrder: "ASC",
 *   filters: { keyword: "immune" },
 * }));
 */
export const fetchPaginatedSkuProductCardsThunk = createAsyncThunk<
  GetSkuProductCardsResponse,
  SkuProductCardQueryParams | undefined
>('skus/fetchPaginatedProductCards', async (params, { rejectWithValue }) => {
  try {
    return await skuService.fetchPaginatedSkuProductCards(params); // Full typed API envelope
  } catch (error: any) {
    console.error('Thunk error: failed to fetch SKU product cards', error);

    return rejectWithValue(
      error?.response?.data || {
        message: 'Failed to fetch SKU product cards',
        raw: error,
      }
    );
  }
});

/**
 * Thunk for fetching a single SKU's detail record by ID.
 *
 * Wraps the service function `fetchSkuDetailById` and returns:
 * - `fulfilled` with `ApiSuccessResponse<SkuDetail>`
 * - `rejected` with `{ message, traceId }` on failure
 *
 * @param skuId - The UUID of the SKU to fetch.
 */
export const getSkuDetailByIdThunk = createAsyncThunk<
  GetSkuDetailResponse,
  string,
  { rejectValue: string }
>('skus/getSkuDetailById', async (skuId, { rejectWithValue }) => {
  try {
    return await skuService.fetchSkuDetailById(skuId);
  } catch (err: any) {
    console.error('Thunk: Failed to fetch SKU detail', err);

    // Normalize error shape for rejectWithValue
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to fetch SKU detail' ||
      err?.response?.data?.traceId ||
      'unknown';

    return rejectWithValue(message);
  }
});

/**
 * Redux Toolkit Thunk — Fetch paginated SKUs with full support for
 * pagination, sorting, and advanced filter options.
 *
 * This thunk issues a GET request to the SKU list endpoint:
 *
 *    GET /skus?page={page}&limit={limit}&sortBy={col}&sortOrder={order}&...
 *
 * The request parameters are normalized into a flat query string and passed
 * directly to the backend, which performs a server-side filtered and sorted
 * query. The response returns a standard paginated envelope:
 *
 *    {
 *      success: true,
 *      message: "...",
 *      data: SkuListItem[],
 *      pagination: {
 *        page,
 *        limit,
 *        totalRecords,
 *        totalPages
 *      }
 *    }
 *
 * The thunk populates the Redux `paginatedSkus` slice with:
 *   - `data`: array of SKU list items
 *   - `pagination`: updated paging metadata
 *   - `loading`: request status
 *   - `error`: error message, if any
 *
 * @param params - Query options for the SKU list request. Includes:
 *   - Pagination (page, limit)
 *   - Sorting (sortBy, sortOrder)
 *   - Filters (keyword, brand, category, dimensions, audit fields, etc.)
 *
 * @returns A promise resolving to the typed `GetSkuListResponse`.
 *
 * @throws {Error} Re-throws request exceptions (network/server/API errors).
 */
export const fetchPaginatedSkusThunk = createAsyncThunk<
  GetSkuListResponse, // Return type
  FetchSkusParams, // Argument type
  { rejectValue: string } // Error payload
>('skus/fetchList', async (params, { rejectWithValue }) => {
  try {
    return await skuService.fetchPaginatedSkus(params);
  } catch (err: any) {
    console.error('fetchSkusThunk error:', err);

    const message =
      err?.response?.data?.message || err?.message || 'Failed to fetch SKUs';

    return rejectWithValue(message);
  }
});

/**
 * RTK Thunk — Create one or more SKU records.
 *
 * This thunk submits a batch of SKU definitions to the backend API,
 * which:
 *   - Generates full SKU codes based on brand/category/variant/region rules
 *   - Inserts the SKU rows in bulk
 *   - Returns metadata describing the result (counts, timings)
 *   - Returns the created SKU records (IDs + generated SKU codes)
 *
 * The thunk automatically:
 *   - Handles loading/error states through Redux
 *   - Normalizes API errors using `rejectWithValue`
 *   - Supports both single-SKU and bulk-SKU creation workflows
 *
 * Typical usage includes SKU creation forms, bulk import dialogs,
 * or administrative SKU management tools.
 *
 * @param payload - Bulk SKU creation input, containing one or more SKU definitions.
 *
 * @returns A promise resolving to the typed `CreateSkuResponse` when successful,
 *          or rejecting with a string message via `rejectWithValue` on failure.
 *
 * @example
 * // Dispatching bulk SKU creation
 * dispatch(createSkusThunk({
 *   skus: [
 *     {
 *       productId: '0b4fe34e-92b8-4bf7-a5d8-0a7e9a588001',
 *       brandCode: 'WN',
 *       categoryCode: 'MO',
 *       variantCode: '411',
 *       regionCode: 'UN',
 *       barcode: '628719706039'
 *     },
 *     {
 *       productId: '91b7ab32-3456-4a91-901f-c4c971adf3ce',
 *       brandCode: 'CJ',
 *       categoryCode: 'IUM',
 *       variantCode: '500',
 *       regionCode: 'CA'
 *     }
 *   ]
 * }));
 *
 * @example
 * // Derived UI logic
 * const { submit, loading, isSuccess, createdSkuCodes } = useCreateSkus();
 *
 * if (isSuccess) {
 *   toast.success(`Created SKUs: ${createdSkuCodes.join(', ')}`);
 * }
 */
export const createSkusThunk = createAsyncThunk<
  CreateSkuResponse, // Returned payload on success
  CreateSkuBulkInput, // Input argument
  { rejectValue: string } // Typed reject payload
>('skus/createSkus', async (payload, { rejectWithValue }) => {
  try {
    return await skuService.createSkus(payload);
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Failed to create SKUs.';
    return rejectWithValue(message);
  }
});

/**
 * Thunk: Update SKU Status
 * ------------------------
 * Dispatches a PATCH request to:
 *
 *    `/skus/:skuId/status`
 *
 * to update the `status_id` field of a specific SKU.
 *
 * This thunk acts as the business-layer entry point for invoking the
 * SKU status update flow, and integrates with the `skuStatus` slice
 * to provide loading, error, data, and success states.
 *
 * ---------------------------------------------------------------------
 * Returns:
 *   A fully typed `UpdateSkuStatusResponse` representing:
 *
 *     {
 *       success: boolean;
 *       message: string;
 *       data: {
 *         id: string; // the updated SKU ID
 *       }
 *     }
 *
 * ---------------------------------------------------------------------
 * Errors:
 *   - Network request failures
 *   - 4xx and 5xx server errors
 *   - Unknown exceptions
 *
 *   All errors are transformed into a user-friendly error message
 *   via `rejectWithValue`, which populates `state.error` in the slice.
 *
 * ---------------------------------------------------------------------
 * Usage Example (Component):
 *
 *   const dispatch = useAppDispatch();
 *
 *   const handleUpdate = () => {
 *     dispatch(updateSkuStatusThunk({
 *       skuId: 'b9e7d...',
 *       status_id: 'ACTIVE'
 *     }));
 *   };
 *
 * ---------------------------------------------------------------------
 * Usage Example (Hook: useSkuStatus):
 *
 *   const { updateStatus, loading, error, isSuccess } = useSkuStatus();
 *
 *   updateStatus({ skuId, status_id: 'DISCONTINUED' });
 *
 * ---------------------------------------------------------------------
 * @param {UpdateSkuStatusThunkArgs} payload
 *   Required parameters:
 *     - skuId: string
 *     - status_id: string (new status to apply)
 *
 * @returns {Promise<UpdateSkuStatusResponse>}
 *   A wrapped API response containing the updated SKU ID.
 *
 * @throws
 *   This thunk *does not* throw directly; instead it delegates error
 *   handling to Redux via `rejectWithValue`.
 */
export const updateSkuStatusThunk = createAsyncThunk<
  UpdateSkuStatusResponse, // return type
  UpdateSkuStatusThunkArgs, // args type
  { rejectValue: string } // error payload type
>('skus/updateStatus', async ({ skuId, statusId }, { rejectWithValue }) => {
  try {
    const payload: UpdateSkuStatusRequestBody = { statusId };
    return await skuService.updateSkuStatus(skuId, payload);
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      'Failed to update SKU status';

    return rejectWithValue(message);
  }
});
