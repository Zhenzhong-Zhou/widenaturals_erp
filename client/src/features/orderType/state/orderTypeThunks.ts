import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  FetchPaginatedOrderTypesParams,
  OrderTypeListResponse,
} from '@features/orderType/state/orderTypeTypes';
import { orderTypeService } from '@services/orderTypeService';
import { flattenOrderTypeRecords } from '@features/orderType/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Thunk to fetch a paginated list of order types.
 *
 * Responsibilities:
 * - Orchestrates async request lifecycle (pending / fulfilled / rejected)
 * - Delegates data fetching to the service layer
 * - Flattens API records into a UI-ready structure before entering Redux state
 * - Normalizes error handling via `rejectWithValue`
 *
 * Design notes:
 * - Service layer returns raw API models
 * - Thunk is the single normalization boundary
 * - Redux state only stores flattened records
 *
 * @param params - Pagination, sorting, and filtering options
 * @returns A fulfilled payload containing flattened order type records
 */
export const fetchPaginatedOrderTypesThunk = createAsyncThunk<
  OrderTypeListResponse,
  FetchPaginatedOrderTypesParams,
  { rejectValue: { message: string } }
>(
  'orderTypes/fetchPaginated',
  async (params, { rejectWithValue }) => {
    try {
      const response =
        await orderTypeService.fetchPaginatedOrderTypes(params);
      
      return {
        ...response,
        data: flattenOrderTypeRecords(response.data),
      };
    } catch (error) {
      return rejectWithValue({
        message:
          extractUiErrorPayload(error)?.message ??
          'Failed to fetch order types',
      });
    }
  }
);
