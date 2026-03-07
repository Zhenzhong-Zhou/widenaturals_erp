import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListResponse,
} from '@features/orderType/state/orderTypeTypes';
import { orderTypeService } from '@services/orderTypeService';
import { flattenOrderTypeRecords } from '@features/orderType/utils';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetches a paginated list of order types and converts
 * API records into a UI-ready structure.
 *
 * Responsibilities:
 * - Calls orderTypeService.fetchPaginatedOrderTypes
 * - Flattens domain records before entering Redux state
 * - Returns pagination metadata unchanged
 *
 * Transformation Boundary:
 * - Raw API models → flattenOrderTypeRecords → UI models
 *
 * Error Model:
 * - All failures return `UiErrorPayload`
 * - Errors are normalized via `extractUiErrorPayload`
 *
 * @param params - Pagination, sorting, and filtering options
 */
export const fetchPaginatedOrderTypesThunk = createAsyncThunk<
  OrderTypeListResponse,
  FetchPaginatedOrderTypesParams,
  { rejectValue: UiErrorPayload }
>('orderTypes/fetchPaginated', async (params, { rejectWithValue }) => {
  try {
    const response = await orderTypeService.fetchPaginatedOrderTypes(params);

    return {
      ...response,
      data: flattenOrderTypeRecords(response.data),
    };
  } catch (error: unknown) {
    return rejectWithValue(extractUiErrorPayload(error));
  }
});
